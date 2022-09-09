import Http from "http";
import Https from "https";

const { apply, construct } = Reflect;
const _Proxy = Proxy;

export default (dependencies) => {
  const {
    util: { identity, assignProperty, getOwnProperty, spyOnce },
    "hook-http": { parseContentType, decodeSafe, parseJSONSafe, spyReadable },
    agent: {
      getSerializationEmptyValue,
      getFreshTab,
      recordBeginEvent,
      recordEndEvent,
      recordBeforeEvent,
      recordAfterEvent,
      getBundlePayload,
      formatRequestPayload,
      formatResponsePayload,
    },
  } = dependencies;
  return {
    unhook: (backup) => backup.forEach(assignProperty),
    hook: (agent, { hooks: { http } }) => {
      if (!http) {
        return [];
      } else {
        const empty = getSerializationEmptyValue(agent);
        const bundle_payload = getBundlePayload(agent);
        const backup = [
          ...["ClientRequest", "request", "get"].map((key) => ({
            object: Http,
            key,
          })),
          ...["request", "get"].map((key) => ({ object: Https, key })),
        ].map(({ object, key }) => ({ object, key, value: object[key] }));
        const spyRequest = (request) => {
          const bundle_tab = getFreshTab(agent);
          const jump_tab = getFreshTab(agent);
          recordBeginEvent(agent, bundle_tab, bundle_payload);
          recordBeforeEvent(
            agent,
            jump_tab,
            formatRequestPayload(
              agent,
              "client",
              "HTTP/1.1",
              request.method,
              request.path,
              null,
              request.getHeaders(),
              empty,
            ),
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
                recordAfterEvent(
                  agent,
                  jump_tab,
                  formatResponsePayload(
                    agent,
                    "client",
                    status,
                    message,
                    headers,
                    body,
                  ),
                );
                recordEndEvent(agent, bundle_tab, bundle_payload);
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
          object[key] = new _Proxy(value, traps);
        }
        return backup;
      }
    },
  };
};
