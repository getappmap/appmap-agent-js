import Http from "http";
import Https from "https";

const { apply, construct } = Reflect;
const _Proxy = Proxy;

export default (dependencies) => {
  const {
    util: { assignProperty },
    frontend: {
      incrementEventCounter,
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
        const index = incrementEventCounter(frontend);
        request.on("finish", () => {
          const { method, path: url } = request;
          const headers = request.getHeaders();
          sendClient(
            client,
            recordBeforeRequest(frontend, index, {
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
          response.on("end", () => {
            sendClient(
              client,
              recordAfterRequest(frontend, index, {
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
