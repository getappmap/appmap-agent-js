import Http from "http";
import Https from "https";

const { nextTick } = process;
const { apply, construct } = Reflect;
const _Proxy = Proxy;
const _undefined = undefined;

export default (dependencies) => {
  const {
    util: { coalesce },
    frontend: {
      incrementEventCounter,
      recordBeforeResponse,
      recordAfterResponse,
    },
    client: { sendClient },
  } = dependencies;
  return {
    unhookResponse: (backup) => {
      if (backup !== null) {
        for (const { protocol, key, value } of backup) {
          protocol[key] = value;
        }
      }
    },
    hookResponse: (client, frontend, { hooks: { http } }) => {
      if (!http) {
        return null;
      }
      const backup = [Http, Https].flatMap((protocol) =>
        ["Server", "createServer"].map((key) => ({
          protocol,
          key,
          value: protocol[key],
        })),
      );
      const spyServer = (server) => {
        server.on("request", (request, response) => {
          const index = incrementEventCounter(frontend);
          // Give time for express to populate the request
          nextTick(() => {
            let route = null;
            if (
              typeof coalesce(request, "baseUrl", _undefined) === "string" &&
              typeof coalesce(request, "route", _undefined) === "object" &&
              typeof coalesce(request.route, "path", _undefined) === "string"
            ) {
              route = `${request.baseUrl}${request.route.path}`;
            }
            const { httpVersion: version, method, url, headers } = request;
            sendClient(
              client,
              recordBeforeResponse(frontend, index, {
                protocol: `HTTP/${version}`,
                method,
                headers,
                url,
                route,
              }),
            );
          });
          response.on("finish", () => {
            const { statusCode: status, statusMessage: message } = response;
            const headers = response.getHeaders();
            sendClient(
              client,
              recordAfterResponse(frontend, index, {
                status,
                message,
                headers,
              }),
            );
          });
        });
      };
      const traps = {
        __proto__: null,
        apply: (target, context, values) => {
          const server = apply(target, context, values);
          spyServer(server);
          return server;
        },
        construct: (target, values, newtarget) => {
          const server = construct(target, values, newtarget);
          spyServer(server);
          return server;
        },
      };
      for (const { protocol, key, value } of backup) {
        protocol[key] = new _Proxy(value, traps);
      }
      return backup;
    },
  };
};
