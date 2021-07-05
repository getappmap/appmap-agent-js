import Http from "http";
import Https from "https";
import Url from "url";
import { assert } from "../../../util.index.mjs";

const global_Reflect_ownKeys = Reflect.ownKeys;
const global_Reflect_apply = Reflect.apply;
const global_Reflect_construct = Reflect.construct;
// const global_String_prototype_replace = String.prototype.replace;
const global_Reflect_getOwnPropertyDescriptor =
  Reflect.getOwnPropertyDescriptor;
const global_undefined = undefined;
const global_Proxy = Proxy;
const global_Object_assign = Object.assign;

// const surroundCurly = (match, part) => `{${part}}`;

const concatParameterObject = (parameters, object) => {
  const keys = global_Reflect_ownKeys(object);
  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];
    const value = object[key];
    parameters[parameters.length] = {
      name: key,
      object_id: null,
      class: "string",
      value,
    };
  }
};

export const hookHTTP = (options, makeCouple) => {
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
      const couple = makeCouple();
      request.on("finish", () => {
        const parameters = [];
        const { protocol, host, pathname, query } = Url.parse(
          `${request.protocol}//${
            request.hasHeader("host") ? request.getHeader("host") : request.host
          }${request.path}`,
          true
        );
        concatParameterObject(parameters, query);
        couple.recordCall({
          http_client_request: {
            request_method: request.method,
            url: Url.format({ protocol, host, pathname }),
            headers: global_Object_assign({}, request.getHeaders()),
          },
          message: parameters,
        });
      });
      request.on("response", (response) => {
        response.on("end", () => {
          couple.recordReturn({
            http_client_response: {
              headers: response.headers,
              status_code: response.statusCode,
              mime_type:
                global_Reflect_getOwnPropertyDescriptor(
                  response.headers,
                  "content-type"
                ) === global_undefined
                  ? null
                  : response.headers["content-type"],
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
        const couple = makeCouple();
        let route = null;
        let parameters = [];
        // if (
        //   // request.baseUrl
        //   global_Reflect_getOwnPropertyDescriptor(request, "baseUrl") !==
        //     global_undefined &&
        //   typeof request.baseUrl === "string" &&
        //   // request.route.path
        //   global_Reflect_getOwnPropertyDescriptor(request, "route") &&
        //   typeof request.route === "object" &&
        //   request.route !== null &&
        //   global_Reflect_getOwnPropertyDescriptor(request.route, "path") !==
        //     global_undefined &&
        //   typeof request.route.path === "string" &&
        //   // request.params
        //   global_Reflect_getOwnPropertyDescriptor(request, "params") !==
        //     global_undefined &&
        //   typeof request.params === "object" &&
        //   request.params !== null
        // ) {
        //   route = global_Reflect_apply(
        //     global_String_prototype_replace,
        //     `${request.baseUrl}${request.route.path}`,
        //     [/:([^/]*)(\/|$)/gu, surroundCurly]
        //   );
        //   concatParameterObject(parameters, request.params);
        // }
        const { pathname, query } = Url.parse(
          `http://host${request.url}`,
          true
        );
        concatParameterObject(parameters, query);
        couple.recordCall({
          http_server_request: {
            headers: request.headers,
            authorization:
              global_Reflect_getOwnPropertyDescriptor(
                request.headers,
                "authorization"
              ) !== global_undefined
                ? request.headers.authorization
                : null,
            mime_type:
              global_Reflect_getOwnPropertyDescriptor(
                request.headers,
                "content-type"
              ) !== global_undefined
                ? request.headers["content-type"]
                : null,
            request_method: request.method,
            path_info: pathname,
            normalized_path_info: route,
            protocol: `HTTP/${request.httpVersion}`,
          },
          message: parameters,
        });
        response.on("finish", () => {
          couple.recordReturn({
            http_server_response: {
              status_code: response.statusCode,
              mime_type: response.hasHeader("content-type")
                ? response.getHeader("content-type")
                : null,
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
