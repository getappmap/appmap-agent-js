import Http from "node:http";
import Https from "node:https";
import {
  toString,
  identity,
  assignProperty,
  getOwnProperty,
  spyOnce,
} from "../../util/index.mjs";
import {
  parseContentType,
  decodeSafe,
  parseJSONSafe,
  spyReadable,
  formatHeaders,
  formatStatus,
} from "../../hook-http/index.mjs";
import { getCurrentGroup } from "../../group/index.mjs";
import { now } from "../../time/index.mjs";
import {
  getSerializationEmptyValue,
  getFreshTab,
  recordBeginBundleEvent,
  recordEndBundleEvent,
  recordBeforeRequestEvent,
  recordAfterResponseEvent,
} from "../../frontend/index.mjs";

const {
  Reflect: { apply, construct },
  Proxy,
} = globalThis;

export const unhook = (backup) => backup.forEach(assignProperty);

export const hook = (frontend, { hooks: { http } }) => {
  if (!http) {
    return [];
  } else {
    const empty = getSerializationEmptyValue(frontend);
    const backup = [
      ...["ClientRequest", "request", "get"].map((key) => ({
        object: Http,
        key,
      })),
      ...["request", "get"].map((key) => ({ object: Https, key })),
    ].map(({ object, key }) => ({ object, key, value: object[key] }));
    const spyRequest = (request) => {
      const bundle_tab = getFreshTab(frontend);
      const jump_tab = getFreshTab(frontend);
      recordBeginBundleEvent(frontend, bundle_tab, getCurrentGroup(), now());
      recordBeforeRequestEvent(
        frontend,
        jump_tab,
        getCurrentGroup(),
        now(),
        "HTTP/1.1",
        toString(request.method),
        toString(request.path),
        null,
        formatHeaders(request.getHeaders()),
        empty,
      );
      request.on("response", (response) => {
        const {
          headers,
          statusCode: status,
          statusMessage: message,
        } = response;
        let body = empty;
        const { type, subtype, parameters } = parseContentType(
          getOwnProperty(headers, "content-type", "text/plain"),
        );
        const compression = getOwnProperty(
          headers,
          "content-encoding",
          "identity",
        );
        if (
          type === "application" &&
          subtype === "json" &&
          compression === "identity"
        ) {
          spyReadable(response, (buffer) => {
            const maybe = decodeSafe(
              buffer,
              getOwnProperty(parameters, "charset", "utf-8"),
              null,
            );
            if (maybe !== null) {
              body = parseJSONSafe(maybe, empty);
            }
          });
        }
        response.once(
          "end",
          spyOnce(() => {
            recordAfterResponseEvent(
              frontend,
              jump_tab,
              getCurrentGroup(),
              now(),
              formatStatus(status),
              toString(message),
              formatHeaders(headers),
              body,
            );
            recordEndBundleEvent(
              frontend,
              bundle_tab,
              getCurrentGroup(),
              now(),
            );
          }, identity),
        );
      });
    };
    const traps = {
      __proto__: null,
      apply: (target, context, values) => {
        const request = apply(target, context, values);
        spyRequest(request);
        return request;
      },
      construct: (target, values, newtarget) => {
        const request = construct(target, values, newtarget);
        spyRequest(request);
        return request;
      },
    };
    for (const { object, key, value } of backup) {
      object[key] = new Proxy(value, traps);
    }
    return backup;
  }
};
