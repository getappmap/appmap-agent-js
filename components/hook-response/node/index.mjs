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
    util: { assert, coalesce, assignProperty },
    log: { logWarning },
    expect: { expect, expectSuccess },
    patch: { patch },
    frontend: {
      incrementEventCounter,
      recordBeginResponse,
      recordEndResponse,
      recordBeforeJump,
      recordAfterJump,
    },
    emitter: { requestRemoteEmitterAsync, sendEmitter },
    http: { generateRespond },
  } = dependencies;
  // TODO: improve test coverage
  /* c8 ignore start */
  const getStringPort = (server) => {
    const address = server.address();
    return typeof address === "string" ? address : _String(address.port);
  };
  const interceptTraffic = (
    { emitter, recorder, regexp },
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
        requestRemoteEmitterAsync(emitter, method, path, body),
      )(request, response);
      return true;
    }
    return false;
  };
  /* c8 ignore stop */
  const beforeRequest = ({ frontend, emitter }, request, response) => {
    // bundle //
    const bundle_index = incrementEventCounter(frontend);
    const begin = () => {
      const { httpVersion: version, method, url, headers } = request;
      const data = {
        protocol: `HTTP/${version}`,
        method,
        headers,
        url,
        route: null,
      };
      sendEmitter(emitter, recordBeginResponse(frontend, bundle_index, data));
      // Give time for express to populate the request
      nextTick(() => {
        if (
          typeof coalesce(request, "baseUrl", _undefined) === "string" &&
          typeof coalesce(request, "route", _undefined) === "object" &&
          typeof coalesce(request.route, "path", _undefined) === "string"
        ) {
          sendEmitter(
            emitter,
            recordBeginResponse(frontend, bundle_index, {
              ...data,
              route: `${request.baseUrl}${request.route.path}`,
            }),
          );
        }
      });
    };
    const end = () => {
      const { statusCode: status, statusMessage: message } = response;
      const headers = response.getHeaders();
      sendEmitter(
        emitter,
        recordEndResponse(frontend, bundle_index, {
          status,
          message,
          headers,
        }),
      );
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
          jump_index = incrementEventCounter(frontend);
          sendEmitter(emitter, recordBeforeJump(frontend, jump_index, null));
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
          sendEmitter(emitter, recordAfterJump(frontend, jump_index, null));
          jump_index = null;
        }
      },
    };
  };
  const afterRequest = ({ resume, pause }, request, response) => {
    let depth = 0;
    const patchEmitter = (emitter) => {
      patch(emitter, "emit", function emit(...args) {
        if (depth === 0) {
          resume();
        }
        depth += 1;
        try {
          return apply(getPrototypeOf(this).emit, this, args);
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
    patch(server, "emit", function emit(name, ...args) {
      if (name !== "request") {
        return apply(getPrototypeOf(server).emit, this, [name, ...args]);
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
    unhookResponse: (backup) => {
      backup.forEach(assignProperty);
    },
    hookResponse: (
      emitter,
      frontend,
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
        emitter,
        frontend,
        recorder,
        regexp: expectSuccess(
          () => new _RegExp(intercept_track_port, "u"),
          "Failed to compile the 'intercept-track-port' configuration field %j as regexp >> %e",
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
