import Http from "http";
import Https from "https";
import { EventEmitter } from "events";

const { nextTick } = process;
const { apply, construct } = Reflect;
const _Proxy = Proxy;
const _undefined = undefined;
const {
  prototype: { emit: _emit },
} = EventEmitter;

export default (dependencies) => {
  const {
    util: { constant, bind, assert, coalesce, assignProperty },
    expect: { expect },
    patch: { patch },
    frontend: {
      incrementEventCounter,
      recordBeginResponse,
      recordEndResponse,
      recordBeforeJump,
      recordAfterJump,
    },
    client: { trackClientAsync, traceClient },
    request: { serve },
  } = dependencies;
  const getPort = (server) => {
    const address = server.address();
    /* c8 ignore start */
    return typeof address === "string" ? address : address.port;
    /* c8 ignore stop */
  };
  const interceptTrackTraffic = (
    { client, intercept_track_port },
    server,
    request,
    response,
  ) => {
    if (
      getPort(server) !== intercept_track_port ||
      !request.url.startsWith("/_appmap/")
    ) {
      return false;
    }
    request.url = request.url.substring("/_appmap".length);
    serve(bind(trackClientAsync, client), request, response);
    return true;
  };
  const beforeRequest = ({ frontend, client }, request, response) => {
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
      traceClient(client, recordBeginResponse(frontend, bundle_index, data));
      // Give time for express to populate the request
      nextTick(() => {
        if (
          typeof coalesce(request, "baseUrl", _undefined) === "string" &&
          typeof coalesce(request, "route", _undefined) === "object" &&
          typeof coalesce(request.route, "path", _undefined) === "string"
        ) {
          traceClient(
            client,
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
      traceClient(
        client,
        recordEndResponse(frontend, bundle_index, {
          status,
          message,
          headers,
        }),
      );
    };
    // jump //
    let jump_index = null;
    let closed = 0;
    request.on("close", () => {
      closed += 1;
    });
    response.on("close", () => {
      closed += 1;
    });
    begin();
    return {
      pause: () => {
        assert(
          jump_index === null,
          "cannot pause http response because we are in jump state",
        );
        if (closed === 2) {
          end();
        } else {
          jump_index = incrementEventCounter(frontend);
          traceClient(client, recordBeforeJump(frontend, jump_index, null));
        }
      },
      resume: () => {
        expect(
          closed < 2,
          "received event after closing both request and response",
        );
        assert(
          jump_index !== null,
          "cannot resume http response because we are not in a jump state",
        );
        traceClient(client, recordAfterJump(frontend, jump_index, null));
        jump_index = null;
      },
    };
  };
  const afterRequest = ({ resume, pause }, request, response) => {
    let depth = 0;
    function emit(...args) {
      if (depth === 0) {
        resume();
      }
      depth += 1;
      try {
        return apply(_emit, this, args);
      } finally {
        depth -= 1;
        if (depth === 0) {
          pause();
        }
      }
    }
    expect(
      patch(request, "emit", emit) === _emit,
      "Unexpected 'emit' method on http.Request",
    );
    expect(
      patch(response, "emit", emit) === _emit,
      "Unexpected 'emit' method on http.Response",
    );
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
    apply(_emit, server, ["request", request, response]);
  const spyServer = (state, server, interceptTraffic, handleTraffic) => {
    const emit = patch(server, "emit", function emit(name, ...args) {
      if (name !== "request") {
        return apply(_emit, this, [name, ...args]);
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
    expect(emit === _emit, "Unexpected 'emit' method on http.Server");
  };
  return {
    unhookResponse: (backup) => backup.forEach(assignProperty),
    hookResponse: (
      client,
      frontend,
      { "intercept-track-port": intercept_track_port, hooks: { http } },
    ) => {
      if (!http && intercept_track_port === 0) {
        return [];
      }
      const interceptTraffic =
        intercept_track_port === 0 ? constant(false) : interceptTrackTraffic;
      const handleTraffic = http ? spyTraffic : forwardTraffic;
      const backup = [Http, Https].flatMap((object) =>
        ["Server", "createServer"].map((key) => ({
          object,
          key,
          value: object[key],
        })),
      );
      const state = { client, frontend, intercept_track_port };
      const traps = {
        __proto__: null,
        apply: (target, context, values) => {
          const server = apply(target, context, values);
          spyServer(state, server, interceptTraffic, handleTraffic);
          return server;
        },
        construct: (target, values, newtarget) => {
          const server = construct(target, values, newtarget);
          spyServer(state, server, interceptTraffic, handleTraffic);
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
