import Http from "http";
import Https from "https";

const { nextTick } = process;
const { apply, construct } = Reflect;
const _Proxy = Proxy;
const _undefined = undefined;

export default (dependencies) => {
  const {
    util: { assert, coalesce, assignProperty },
    expect: { expect },
    emitter: { spyEmitter, spyFlattenEmitterList },
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
      const beforeRequest = (emitter, name, [request, response], link) => {
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
              typeof coalesce(request, "baseUrl", _undefined) === "string" &&
              typeof coalesce(request, "route", _undefined) === "object" &&
              typeof coalesce(request.route, "path", _undefined) === "string"
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
        let closed = 0;
        link.resume = (emitter, name) => {
          expect(
            closed < 2,
            "received event %j after closing both request and response",
            name,
          );
          assert(
            jump_index !== null,
            "cannot resume http response because we are not in a jump state",
          );
          sendClient(client, recordAfterJump(frontend, jump_index, null));
          jump_index = null;
        };
        link.pause = (emitter, name) => {
          assert(
            jump_index === null,
            "cannot pause http response because we are in jump state",
          );
          if (closed === 2) {
            end();
          } else {
            jump_index = incrementEventCounter(frontend);
            sendClient(client, recordBeforeJump(frontend, jump_index, null));
          }
        };
        request.on("close", () => {
          closed += 1;
        });
        response.on("close", () => {
          closed += 1;
        });
        begin();
      };
      const afterRequest = (
        emitter,
        name,
        [request, response],
        { resume, pause },
      ) => {
        pause(emitter, name);
        spyFlattenEmitterList([request, response], /^/u, resume, pause);
      };
      const spyServer = (server) => {
        spyEmitter(server, /^request$/, beforeRequest, afterRequest);
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
