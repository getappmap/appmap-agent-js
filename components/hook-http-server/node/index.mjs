import Http from "http";
import Https from "https";

const _RegExp = RegExp;
const _String = String;
const { nextTick } = process;
const { apply, construct, getPrototypeOf } = Reflect;
const _Proxy = Proxy;
const _Set = Set;
const _undefined = undefined;

export default (dependencies) => {
  const {
    util: { assert, coalesce, assignProperty, getOwnProperty },
    "hook-http": { parseContentType, decodeSafe, parseJSONSafe, spyWritable },
    log: { logWarning },
    expect: { expect, expectSuccess },
    patch: { patch },
    agent: {
      getSerializationEmptyValue,
      requestRemoteAgentAsync,
      recordBeginServer,
      recordEndServer,
      recordBeforeJump,
      recordAfterJump,
      amendBeginServer,
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
  const beforeRequest = ({ agent }, request, response) => {
    let response_body_buffer = null;
    spyWritable(response, (buffer) => {
      response_body_buffer = buffer;
    });
    // bundle //
    let bundle_index;
    const begin = () => {
      const { httpVersion: version, method, url, headers } = request;
      const data = {
        protocol: `HTTP/${version}`,
        method,
        url,
        route: null,
        headers,
        body: getSerializationEmptyValue(agent),
      };
      bundle_index = recordBeginServer(agent, data);
      // Give time for express to populate the request
      nextTick(() => {
        if (
          typeof coalesce(request, "baseUrl", _undefined) === "string" &&
          typeof coalesce(request, "route", _undefined) === "object" &&
          typeof coalesce(request.route, "path", _undefined) === "string"
        ) {
          amendBeginServer(agent, bundle_index, {
            ...data,
            route: `${request.baseUrl}${request.route.path}`,
          });
        }
      });
    };
    const end = () => {
      const { statusCode: status, statusMessage: message } = response;
      const headers = response.getHeaders();
      const { type, subtype, parameters } = parseContentType(
        getOwnProperty(headers, "content-type", "text/plain"),
      );
      let body = getSerializationEmptyValue(agent);
      assert(response_body_buffer !== null, "failed to spy response");
      if (type === "application" && subtype === "json") {
        const maybe = decodeSafe(
          response_body_buffer,
          getOwnProperty(parameters, "charset", "utf-8"),
          null,
        );
        if (maybe !== null) {
          body = parseJSONSafe(maybe, getSerializationEmptyValue(agent));
        }
      }
      recordEndServer(agent, bundle_index, {
        status,
        message,
        headers,
        body,
      });
    };
    // jump //
    let jump_index = null;
    let closed = new _Set();
    request.on("close", () => {
      closed.add("request");
    });
    response.on("close", () => {
      closed.add("response");
    });
    begin();
    return {
      pause: () => {
        assert(
          jump_index === null,
          "cannot pause http response because we are in jump state",
        );
        if (closed.has("request") && closed.has("response")) {
          if (!closed.has("cycle")) {
            closed.add("cycle");
            end();
          }
        } else {
          jump_index = recordBeforeJump(agent, null);
        }
      },
      resume: () => {
        if (closed.has("request") && closed.has("response")) {
          assert(
            closed.has("cycle"),
            "upon resuming closed request and response, the cycle should be closed as well",
          );
          assert(
            jump_index === null,
            "upon resuming closed request and response, we should not be in a jump state",
          );
          logWarning(
            "HTTP activity detected after closing both the request and the response.",
          );
        } else {
          assert(
            jump_index !== null,
            "cannot resume http response because we are not in a jump state",
          );
          recordAfterJump(agent, jump_index, null);
          jump_index = null;
        }
      },
    };
  };
  const afterRequest = ({ resume, pause }, request, response) => {
    let depth = 0;
    const patchEmitter = (emitter) => {
      const original_emit = patch(emitter, "emit", function emit(...args) {
        if (depth === 0) {
          resume();
        }
        depth += 1;
        try {
          return apply(original_emit, this, args);
        } finally {
          depth -= 1;
          if (depth === 0) {
            pause();
          }
        }
      });
    };
    patchEmitter(request);
    patchEmitter(response);
    pause();
  };
  const spyTraffic = (state, server, request, response) => {
    const shared = beforeRequest(state, request, response);
    try {
      forwardTraffic(state, server, request, response);
    } finally {
      afterRequest(shared, request, response);
    }
  };
  const forwardTraffic = (state, server, request, response) =>
    apply(getPrototypeOf(server).emit, server, ["request", request, response]);
  const spyServer = (state, server, handleTraffic) => {
    const original_emit = patch(server, "emit", function emit(name, ...args) {
      if (name !== "request") {
        return apply(original_emit, this, [name, ...args]);
      }
      expect(
        args.length === 2,
        "expected exactly two arguments for request event on server",
      );
      const [request, response] = args;
      if (!interceptTraffic(state, this, request, response)) {
        handleTraffic(state, this, request, response);
      }
      return true;
    });
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
      }
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
    },
  };
};
