import Http from "http";
import Https from "https";

const { apply, construct } = Reflect;
const { nextTick } = process;
const _Proxy = Proxy;

export default (dependencies) => {
  const {
    util: { assignProperty },
    frontend: {
      incrementEventCounter,
      recordBeginBundle,
      recordEndBundle,
      recordBeforeRequest,
      recordAfterRequest,
    },
    client: { sendClient },
  } = dependencies;
  return {
    unhookRequest: (backup) => backup.forEach(assignProperty),
    hookRequest: (client, frontend, { hooks: { http } }) => {
      if (!http) {
        return [];
      }
      const backup = [
        ...["ClientRequest", "request", "get"].map((key) => ({
          object: Http,
          key,
        })),
        ...["request", "get"].map((key) => ({ object: Https, key })),
      ].map(({ object, key }) => ({ object, key, value: object[key] }));
      const spyRequest = (request) => {
        const index1 = incrementEventCounter(frontend);
        const index2 = incrementEventCounter(frontend);
        request.on("finish", () => {
          const { method, path: url } = request;
          const headers = request.getHeaders();
          sendClient(client, recordBeginBundle(frontend, index1, null));
          sendClient(
            client,
            recordBeforeRequest(frontend, index2, {
              protocol: "HTTP/1.1",
              method,
              url,
              headers,
            }),
          );
        });
        request.on("response", (response) => {
          const {
            headers,
            statusCode: status,
            statusMessage: message,
          } = response;
          // Hoopfully, this is triggered before user 'end' handlers.
          // Use of removeAllListeners or prependListener will break this assumption.
          response.on("end", () => {
            sendClient(
              client,
              recordAfterRequest(frontend, index2, {
                status,
                message,
                headers,
              }),
            );
          });
          nextTick(() => {
            // Hoopfully, this is triggered after user 'end' handlers.
            // Since emit is synchronous the groups will still match!
            response.on("end", () => {
              sendClient(client, recordEndBundle(frontend, index1, null));
            });
          });
        });
      };
      const traps = {
        __proto__: null,
        apply: (target, context, values) => {
          const request = apply(target, context, values);
          spyRequest(request);
          return request;
        },
        construct: (target, values, newtarget) => {
          const request = construct(target, values, newtarget);
          spyRequest(request);
          return request;
        },
      };
      for (const { object, key, value } of backup) {
        object[key] = new _Proxy(value, traps);
      }
      return backup;
    },
  };
};
