import Http from "http";
import Https from "https";

const { apply, construct } = Reflect;
const _Proxy = Proxy;

export default (dependencies) => {
  const {
    frontend: {
      incrementEventCounter,
      recordBeforeRequest,
      recordAfterRequest,
    },
    client: { sendClient },
  } = dependencies;
  return {
    unhookRequest: (backup) => {
      if (backup !== null) {
        for (const { protocol, key, value } of backup) {
          protocol[key] = value;
        }
      }
    },
    hookRequest: (client, frontend, { hooks: { http } }) => {
      if (!http) {
        return null;
      }
      const backup = [
        ...["ClientRequest", "request", "get"].map((key) => ({
          protocol: Http,
          key,
        })),
        ...["request", "get"].map((key) => ({ protocol: Https, key })),
      ].map(({ protocol, key }) => ({ protocol, key, value: protocol[key] }));
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
      for (const { protocol, key, value } of backup) {
        protocol[key] = new _Proxy(value, traps);
      }
      return backup;
    },
  };
};
