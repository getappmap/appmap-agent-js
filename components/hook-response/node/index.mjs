import Http from "http";
import Https from "https";

const { nextTick } = process;
const { apply, construct } = Reflect;
const _Proxy = Proxy;
const _undefined = undefined;

export default (dependencies) => {
  const {
    util: { assert, coalesce, assignProperty, spyEmitter },
    frontend: {
      incrementEventCounter,
      recordPlaceholder,
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
        let pending_pause = null;
        spyEmitter(
          server,
          /^request$/,
          (request, response) => {
            // bundle //
            const bundle_index = incrementEventCounter(frontend);
            const begin = () => {
              const placeholder_index = incrementEventCounter(frontend);
              sendClient(
                client,
                recordPlaceholder(frontend, bundle_index, placeholder_index),
              );
              // Give time for express to populate the request
              nextTick(() => {
                let route = null;
                if (
                  typeof coalesce(request, "baseUrl", _undefined) ===
                    "string" &&
                  typeof coalesce(request, "route", _undefined) === "object" &&
                  typeof coalesce(request.route, "path", _undefined) ===
                    "string"
                ) {
                  route = `${request.baseUrl}${request.route.path}`;
                }
                const { httpVersion: version, method, url, headers } = request;
                sendClient(
                  client,
                  recordBeginResponse(frontend, placeholder_index, {
                    protocol: `HTTP/${version}`,
                    method,
                    headers,
                    url,
                    route,
                  }),
                );
              });
            };
            const end = () => {
              const { statusCode: status, statusMessage: message } = response;
              const headers = response.getHeaders();
              sendClient(
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
            const resume = () => {
              assert(jump_index !== null);
              sendClient(client, recordAfterJump(frontend, jump_index, null));
              jump_index = null;
            };
            const pause = () => {
              assert(jump_index === null, "unexpected jump index");
              jump_index = incrementEventCounter(frontend);
              sendClient(client, recordBeforeJump(frontend, jump_index, null));
            };
            response.prependListener("close", resume);
            response.addListener("close", end);
            spyEmitter(request, /^/u, resume, pause);
            spyEmitter(response, /^(?!close)$/u, resume, pause);
            spyEmitter(response, /^close$/u, resume, end);
            begin();
            assert(pending_pause === null, "unexpected pending pause function");
            pending_pause = pause;
          },
          () => {
            assert(pending_pause !== null, "expected a pending pause function");
            pending_pause();
            pending_pause = null;
          },
        );
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
