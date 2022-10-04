const {
  URL,
  RegExp,
  String,
  process: { nextTick },
  Reflect: { apply, construct },
  Proxy,
  undefined,
} = globalThis;

const { search: __search } = new URL(import.meta.url);

import Http from "http";
import Https from "https";
const {
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
} = await import(`../../util/index.mjs${__search}`);
const {
  parseContentType,
  decodeSafe,
  parseJSONSafe,
  spyWritable,
  formatHeaders,
  formatStatus,
} = await import(`../../hook-http/index.mjs${__search}`);
const { expect, expectSuccess } = await import(
  `../../expect/index.mjs${__search}`
);
const { patch } = await import(`../../patch/index.mjs${__search}`);
const {
  getFreshTab,
  getSerializationEmptyValue,
  requestRemoteAgentAsync,
  recordBeginAmend,
  recordBeginEvent,
  recordEndEvent,
  recordBeforeEvent,
  recordAfterEvent,
  formatRequestPayload,
  formatResponsePayload,
  getJumpPayload,
} = await import(`../../agent/index.mjs${__search}`);
const { generateRespond } = await import(`../../http/index.mjs${__search}`);

// TODO: improve test coverage

/* c8 ignore start */
const getStringPort = (server) => {
  const address = server.address();
  return typeof address === "string" ? address : String(address.port);
};

const interceptTraffic = (
  { agent, recorder, regexp },
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
      requestRemoteAgentAsync(agent, method, path, body),
    )(request, response);
    return true;
  } else {
    return false;
  }
};

/* c8 ignore stop */

const recordBegin = ({ agent, empty }, tab, request) => {
  const { httpVersion: version, method, url, headers } = request;
  const protocol = `HTTP/${version}`;
  recordBeginEvent(
    agent,
    tab,
    formatRequestPayload(
      agent,
      "server",
      toString(protocol),
      toString(method),
      toString(url),
      null,
      formatHeaders(headers),
      empty,
    ),
  );
  // Give time for express to populate the request
  nextTick(() => {
    if (
      typeof coalesce(request, "baseUrl", undefined) === "string" &&
      typeof coalesce(request, "route", undefined) === "object" &&
      typeof coalesce(request.route, "path", undefined) === "string"
    ) {
      recordBeginAmend(
        agent,
        tab,
        formatRequestPayload(
          agent,
          "server",
          toString(protocol),
          toString(method),
          toString(url),
          `${request.baseUrl}${request.route.path}`,
          formatHeaders(headers),
          empty,
        ),
      );
    }
  });
};

const recordEnd = ({ agent }, tab, response, body) => {
  recordEndEvent(
    agent,
    tab,
    formatResponsePayload(
      agent,
      "server",
      formatStatus(response.statusCode),
      toString(response.statusMessage),
      formatHeaders(response.getHeaders()),
      body,
    ),
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

const trackJump = ({ agent, jump_payload }, box, emitter) => {
  const tracking = createBox(true);
  patch(
    emitter,
    "emit",
    (original_emit) =>
      function emit(...args) {
        if (getBox(tracking)) {
          recordAfterEvent(agent, getBox(box), jump_payload);
          setBox(box, getFreshTab(agent));
          try {
            return apply(original_emit, this, args);
          } finally {
            recordBeforeEvent(agent, getBox(box), jump_payload);
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
  const { agent, empty } = state;
  const bundle_tab = getFreshTab(agent);
  const jump_box = createBox(getFreshTab(agent));
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
        recordAfterEvent(state.agent, getBox(jump_box), state.jump_payload);
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
    recordBeforeEvent(state.agent, getBox(jump_box), state.jump_payload);
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
          expect(
            args.length === 2,
            "expected exactly two arguments for request event on server",
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

export const hook = (
  agent,
  { recorder, "intercept-track-port": intercept_track_port, hooks: { http } },
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
      agent,
      recorder,
      jump_payload: getJumpPayload(agent),
      empty: getSerializationEmptyValue(agent),
      regexp: expectSuccess(
        () => new RegExp(intercept_track_port, "u"),
        "Failed to compile the 'intercept-track-port' configuration field %j as regexp >> %O",
        intercept_track_port,
      ),
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
