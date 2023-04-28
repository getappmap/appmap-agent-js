import Http from "node:http";
import Https from "node:https";
import { ExternalAppmapError } from "../../error/index.mjs";
import { logError, logErrorWhen } from "../../log/index.mjs";
import {
  assert,
  toString,
  fromMaybe,
  spyOnce,
  createBox,
  getBox,
  setBox,
  identity,
  coalesce,
  assignProperty,
  getOwnProperty,
} from "../../util/index.mjs";
import {
  parseContentType,
  decodeSafe,
  parseJSONSafe,
  spyWritable,
  formatHeaders,
  formatStatus,
} from "../../hook-http/index.mjs";
import { patch } from "../../patch/index.mjs";
import { getCurrentGroup } from "../../group/index.mjs";
import { now } from "../../time/index.mjs";
import {
  getFreshTab,
  getSerializationEmptyValue,
  recordBeginRequestAmend,
  recordBeginRequestEvent,
  recordEndResponseEvent,
  recordBeforeJumpEvent,
  recordAfterJumpEvent,
} from "../../frontend/index.mjs";
import { generateRespond, requestAsync } from "../../http/index.mjs";

const {
  RegExp,
  String,
  process: { nextTick },
  Reflect: { apply, construct },
  Proxy,
  undefined,
} = globalThis;

// TODO: improve test coverage

/* c8 ignore start */
const getStringPort = (server) => {
  const address = server.address();
  return typeof address === "string" ? address : String(address.port);
};

const interceptTraffic = (
  { host, track_port, recorder, regexp },
  server,
  request,
  response,
) => {
  if (
    recorder === "remote" &&
    request.url.startsWith("/_appmap/") &&
    regexp.test(getStringPort(server))
  ) {
    request.url = request.url.substring("/_appmap".length);
    generateRespond((method, path, body) =>
      requestAsync(host, track_port, method, `/_appmap${path}`, body),
    )(request, response);
    return true;
  } else {
    return false;
  }
};

/* c8 ignore stop */

const recordBegin = ({ frontend, empty }, tab, request) => {
  const { httpVersion: version, method, url, headers } = request;
  const protocol = `HTTP/${version}`;
  recordBeginRequestEvent(
    frontend,
    tab,
    getCurrentGroup(),
    now(),
    toString(protocol),
    toString(method),
    toString(url),
    null,
    formatHeaders(headers),
    empty,
  );
  // Give time for express to populate the request
  nextTick(() => {
    if (
      typeof coalesce(request, "baseUrl", undefined) === "string" &&
      typeof coalesce(request, "route", undefined) === "object" &&
      typeof coalesce(request.route, "path", undefined) === "string"
    ) {
      recordBeginRequestAmend(
        frontend,
        tab,
        toString(protocol),
        toString(method),
        toString(url),
        `${request.baseUrl}${request.route.path}`,
        formatHeaders(headers),
        empty,
      );
    }
  });
};

const recordEnd = ({ frontend }, tab, response, body) => {
  recordEndResponseEvent(
    frontend,
    tab,
    getCurrentGroup(),
    now(),
    formatStatus(response.statusCode),
    toString(response.statusMessage),
    formatHeaders(response.getHeaders()),
    body,
  );
};

const serializeResponseBody = ({ empty }, response, buffer) => {
  const headers = response.getHeaders();
  const { type, subtype, parameters } = parseContentType(
    getOwnProperty(headers, "content-type", "text/plain"),
  );
  const compression = getOwnProperty(headers, "content-encoding", "identity");
  if (
    type === "application" &&
    subtype === "json" &&
    compression === "identity"
  ) {
    return fromMaybe(
      decodeSafe(buffer, getOwnProperty(parameters, "charset", "utf-8"), null),
      empty,
      (string) => parseJSONSafe(string, empty),
    );
  } /* c8 ignore start */ else {
    return empty;
  } /* c8 ignore stop */
};

const trackJump = ({ frontend }, box, emitter) => {
  const tracking = createBox(true);
  patch(
    emitter,
    "emit",
    (original_emit) =>
      function emit(...args) {
        if (getBox(tracking)) {
          recordAfterJumpEvent(frontend, getBox(box), getCurrentGroup(), now());
          setBox(box, getFreshTab(frontend));
          try {
            return apply(original_emit, this, args);
          } finally {
            recordBeforeJumpEvent(
              frontend,
              getBox(box),
              getCurrentGroup(),
              now(),
            );
          }
        } else {
          return apply(original_emit, this, args);
        }
      },
  );
  return tracking;
};

const forwardTraffic = (
  _state,
  original_server_emit,
  server,
  request,
  response,
) => apply(original_server_emit, server, ["request", request, response]);

const spyTraffic = (state, original_server_emit, server, request, response) => {
  const { frontend, empty } = state;
  const bundle_tab = getFreshTab(frontend);
  const jump_box = createBox(getFreshTab(frontend));
  const request_tracking = trackJump(state, jump_box, request);
  const response_tracking = trackJump(state, jump_box, response);
  let body = empty;
  spyWritable(response, (buffer) => {
    body = serializeResponseBody(state, response, buffer);
  });
  const generateStopTracking = (box, peer_box) => () => {
    setBox(box, false);
    if (!getBox(peer_box)) {
      // make sure the end event is the last of the tab
      nextTick(() => {
        recordAfterJumpEvent(
          state.frontend,
          getBox(jump_box),
          getCurrentGroup(),
          now(),
        );
        recordEnd(state, bundle_tab, response, body);
      });
    }
  };
  request.once(
    "close",
    spyOnce(
      generateStopTracking(request_tracking, response_tracking),
      identity,
    ),
  );
  response.once(
    "close",
    spyOnce(
      generateStopTracking(response_tracking, request_tracking),
      identity,
    ),
  );
  recordBegin(state, bundle_tab, request);
  try {
    return forwardTraffic(
      state,
      original_server_emit,
      server,
      request,
      response,
    );
  } finally {
    recordBeforeJumpEvent(frontend, getBox(jump_box), getCurrentGroup(), now());
  }
};

const spyServer = (state, server, handleTraffic) => {
  patch(
    server,
    "emit",
    (original_server_emit) =>
      function emit(name, ...args) {
        if (name !== "request") {
          return apply(original_server_emit, this, [name, ...args]);
        } else {
          assert(
            !logErrorWhen(
              args.length !== 2,
              "Expected exactly two arguments for `request` event listener on `node:http.Server`",
            ),
            "Unexpected argument number on 'request' event listener",
            ExternalAppmapError,
          );
          const [request, response] = args;
          if (!interceptTraffic(state, this, request, response)) {
            handleTraffic(state, original_server_emit, this, request, response);
          }
          return true;
        }
      },
  );
};

export const unhook = (backup) => {
  backup.forEach(assignProperty);
};

const compileInterceptTrackPort = (source) => {
  try {
    return new RegExp(source, "u");
  } catch (error) {
    logError(
      "Failed to compile the 'intercept-track-port' configuration field %j as regexp >> %O",
      source,
      error,
    );
    throw new ExternalAppmapError("intercept-track-port is not a regexp");
  }
};

export const hook = (
  frontend,
  {
    recorder,
    host,
    "intercept-track-port": intercept_track_port,
    "track-port": track_port,
    hooks: { http },
  },
) => {
  if (!http && recorder !== "remote") {
    return [];
  } else {
    const handleTraffic = http ? spyTraffic : forwardTraffic;
    const backup = [Http, Https].flatMap((object) =>
      ["Server", "createServer"].map((key) => ({
        object,
        key,
        value: object[key],
      })),
    );
    const state = {
      frontend,
      recorder,
      track_port,
      host,
      empty: getSerializationEmptyValue(frontend),
      regexp: compileInterceptTrackPort(intercept_track_port),
    };
    const traps = {
      __proto__: null,
      apply: (target, context, values) => {
        const server = apply(target, context, values);
        spyServer(state, server, handleTraffic);
        return server;
      },
      construct: (target, values, newtarget) => {
        const server = construct(target, values, newtarget);
        spyServer(state, server, handleTraffic);
        return server;
      },
    };
    for (const { object, key, value } of backup) {
      object[key] = new Proxy(value, traps);
    }
    return backup;
  }
};
