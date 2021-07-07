import * as Http from "http";
import { deadcode, compose, assert, expect, expectDeadcode } from ("../../../util/index.mjs");
import { checkOptions } from "../check-options.mjs";

const global_Promise = Promise;
const global_JSON_stringify = JSON.stringify;
const global_JSON_parse = JSON.parse;

// This is necessary to avoid infinite recursion when http-hook is true
const Http_request = Http.request;

const onRequestError = expectDeadcode("http1 request failure >> %e");

const onResponseError = expectDeadcode("http1 response failure >> %e");

const onReponseData = deadcode("non-empty http1 response body");

const onResponse = (response) => {
  assert(response.statusCode === 200, "non 200 http1 status");
  response.on("error", onResponseError);
  response.on("data", onReponseData);
  response.on("end", noop);
};

export default = ({}, options) => {
  const {host, port} = checkOptions(options);
  const options = {
    agent: new Http.Agent({
      keepAlive: true,
    }),
    ... (
      typeof port === "number" ?
      {host, port} :
      {socketPath: port}
    ),
    method: "PUT",
    path: "/",
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  };
  return () => {
    const head = getUniqueIdentifier();
    return {
      send: (body) => {
        const request = Http_request(options);
        request.on("error", onRequestError));
        request.on("response", onResponse);
        request.end(global_JSON_stringify({head, body}), "utf8");
      },
      close: noop,
    };
  };
};
