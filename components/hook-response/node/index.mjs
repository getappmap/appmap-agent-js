import Http from "http";
import Https from "https";

const { nextTick } = process;
const { apply, construct } = Reflect;
const _Proxy = Proxy;
const _undefined = undefined;

export default (dependencies) => {
  const {
    util: { coalesce, assignProperty },
    frontend: {
      incrementEventCounter,
      recordBeginResponse,
      recordEndResponse,
      recordBeforeJump,
      recordAfterJump,
    },
    client: { sendClient },
  } = dependencies;
  return {
    unhookResponse: (backup) => backup.forEach(assignProperty),
    hookResponse: (client, frontend, { hooks: { http } }) => {
      if (!http) {
        return [];
      }
      const backup = [Http, Https].flatMap((object) =>
        ["Server", "createServer"].map((key) => ({
          object,
          key,
          value: object[key],
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
              recordBeginResponse(frontend, index, {
                protocol: `HTTP/${version}`,
                method,
                headers,
                url,
                route,
              }),
            );
            sendClient(client, recordBeforeJump(frontend, index, null));
          });
          response.on("finish", () => {
            const { statusCode: status, statusMessage: message } = response;
            const headers = response.getHeaders();
            sendClient(client, recordAfterJump(frontend, index, null));
            sendClient(
              client,
              recordEndResponse(frontend, index, {
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
      for (const { object, key, value } of backup) {
        object[key] = new _Proxy(value, traps);
      }
      return backup;
    },
  };
};
