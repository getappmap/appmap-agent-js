const Http = require("http");
const Https = require("https");
const { assert } = require("../check.js");

const global_Reflect_apply = Reflect.apply;
const global_Reflect_construct = Reflect.construct;
const global_String_prototype_split = String.prototype.split;
const global_Reflect_getOwnPropertyDescriptor =
  Reflect.getOwnPropertyDescriptor;
const global_undefined = undefined;
const global_Proxy = Proxy;
const global_Object_assign = Object.assign;

exports.hookHTTP = (runtime) => {
  let save = {
    client: [
      { protocol: Http, key: "ClientRequest", value: Http.ClientRequest },
      { protocol: Http, key: "request", value: Http.request },
      { protocol: Http, key: "get", value: Http.get },
      { protocol: Https, key: "request", value: Https.request },
      { protocol: Https, key: "get", value: Https.get },
    ],
    server: [
      { protocol: Http, key: "Server", value: Http.Server },
      { protocol: Http, key: "createServer", value: Http.createServer },
      { protocol: Https, key: "Server", value: Https.Server },
      { protocol: Https, key: "createServer", value: Https.createServer },
    ],
  };
  {
    const hook = (request) => {
      runtime.event += 1;
      const id = runtime.event;
      const now = runtime.getNow();
      request.on("finish", () => {
        let path = request.path;
        let search = "";
        const parts = global_Reflect_apply(
          global_String_prototype_split,
          path,
          ["?"]
        );
        if (parts.length > 1) {
          path = parts[0];
          search = parts[1];
        }
        runtime.record(null, {
          id,
          event: "call",
          thread_id: runtime.pid,
          http_client_request: {
            request_method: request.method,
            url: `${request.protocol}//${
              request.hasHeader("host")
                ? request.getHeader("host")
                : request.host
            }${path}`,
            message: search,
            headers: global_Object_assign({}, request.getHeaders()),
          },
        });
      });
      request.on("response", (response) => {
        response.on("end", () => {
          runtime.event += 1;
          runtime.record(null, {
            id: runtime.event,
            event: "return",
            thread_id: runtime.pid,
            parent_id: id,
            elapsed: runtime.getNow() - now,
            http_client_response: {
              status_code: response.statusCode,
              status_message: response.statusMessage,
              mime_type:
                global_Reflect_getOwnPropertyDescriptor(
                  response.headers,
                  "content-type"
                ) === global_undefined
                  ? null
                  : response.headers["content-type"],
              headers: response.headers,
            },
          });
        });
      });
      return request;
    };
    const traps = {
      __proto__: null,
      apply: (target, context, values) =>
        hook(global_Reflect_apply(target, context, values)),
      construct: (target, values, newtarget) =>
        hook(global_Reflect_construct(target, values, newtarget)),
    };
    for (let index = 0; index < save.client.length; index++) {
      const { protocol, key, value } = save.client[index];
      protocol[key] = new global_Proxy(value, traps);
    }
  }
  {
    const hook = (server) => {
      server.on("request", (request, response) => {
        runtime.event += 1;
        const id = runtime.event;
        const now = runtime.getNow();
        runtime.record(null, {
          id,
          event: "call",
          thread_id: runtime.pid,
          http_server_request: {
            request_method: request.method,
            path_info: request.url,
            protocol: `HTTP/${request.httpVersion}`,
            headers: request.headers,
          },
        });
        response.on("finish", () => {
          runtime.event += 1;
          runtime.record(null, {
            id: runtime.event,
            event: "return",
            parent_id: id,
            elapsed: runtime.getNow() - now,
            http_server_response: {
              status_code: response.statusCode,
              status_message: response.statusMessage,
              mime_type: response.hasHeader("content-type")
                ? response.getHeader("content-type")
                : null,
              headers: global_Object_assign({}, response.getHeaders()),
            },
          });
        });
      });
      return server;
    };
    const traps = {
      __proto__: null,
      apply: (target, context, values) =>
        hook(global_Reflect_apply(target, context, values)),
      construct: (target, values, newtarget) =>
        hook(global_Reflect_construct(target, values, newtarget)),
    };
    for (let index = 0; index < save.server.length; index++) {
      const { protocol, key, value } = save.server[index];
      protocol[key] = new global_Proxy(value, traps);
    }
  }
  return () => {
    assert(save !== null, "this http hook has already been stopped");
    for (let index = 0; index < save.client.length; index++) {
      const { protocol, key, value } = save.client[index];
      protocol[key] = value;
    }
    for (let index = 0; index < save.server.length; index++) {
      const { protocol, key, value } = save.server[index];
      protocol[key] = value;
    }
    save = null;
  };
};
