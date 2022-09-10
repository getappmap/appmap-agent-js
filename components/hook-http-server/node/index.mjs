import Http from "http";
import Https from "https";

const _RegExp = RegExp;
const _String = String;
const { nextTick } = process;
const { apply, construct } = Reflect;
const _Proxy = Proxy;
const _undefined = undefined;

export default (dependencies) => {
  const {
    util: {
      fromMaybe,
      spyOnce,
      createBox,
      getBox,
      setBox,
      identity,
      coalesce,
      assignProperty,
      getOwnProperty,
    },
    "hook-http": { parseContentType, decodeSafe, parseJSONSafe, spyWritable },
    expect: { expect, expectSuccess },
    patch: { patch },
    agent: {
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
    },
    http: { generateRespond },
  } = dependencies;

  // TODO: improve test coverage

  /* c8 ignore start */
  const getStringPort = (server) => {
    const address = server.address();
    return typeof address === "string" ? address : _String(address.port);
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
        protocol,
        method,
        url,
        null,
        headers,
        empty,
      ),
    );
    // Give time for express to populate the request
    nextTick(() => {
      if (
        typeof coalesce(request, "baseUrl", _undefined) === "string" &&
        typeof coalesce(request, "route", _undefined) === "object" &&
        typeof coalesce(request.route, "path", _undefined) === "string"
      ) {
        recordBeginAmend(
          agent,
          tab,
          formatRequestPayload(
            agent,
            "server",
            protocol,
            method,
            url,
            `${request.baseUrl}${request.route.path}`,
            headers,
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
        response.statusCode,
        response.statusMessage,
        response.getHeaders(),
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
        decodeSafe(
          buffer,
          getOwnProperty(parameters, "charset", "utf-8"),
          null,
        ),
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

  const spyTraffic = (
    state,
    original_server_emit,
    server,
    request,
    response,
  ) => {
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

  const forwardTraffic = (
    _state,
    original_server_emit,
    server,
    request,
    response,
  ) => apply(original_server_emit, server, ["request", request, response]);

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
              handleTraffic(
                state,
                original_server_emit,
                this,
                request,
                response,
              );
            }
            return true;
          }
        },
    );
  };

  return {
    unhook: (backup) => {
      backup.forEach(assignProperty);
    },
    hook: (
      agent,
      {
        recorder,
        "intercept-track-port": intercept_track_port,
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
          agent,
          recorder,
          jump_payload: getJumpPayload(agent),
          empty: getSerializationEmptyValue(agent),
          regexp: expectSuccess(
            () => new _RegExp(intercept_track_port, "u"),
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
          object[key] = new _Proxy(value, traps);
        }
        return backup;
      }
    },
  };
};
