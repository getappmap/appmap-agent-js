const Http = require("http");
const { assert, expect } = require("../../check.js");
const { makeErrorHandler } = require("./error.js");

const global_Promise = Promise;
const global_JSON_stringify = JSON.stringify;
const global_JSON_parse = JSON.parse;

// This is necessary to avoid infinite recursion when http-hook is true
const makeRequest = Http.request;

const onRequestError = makeErrorHandler("http1 request");

const onResponseError = makeErrorHandler("http1 response");

exports.makeRequestAsync = (host, port) => {
  const agent = new Http.Agent({
    keepAlive: true,
  });
  const options =
    typeof port === "number"
      ? {
          agent,
          host,
          port,
          method: "PUT",
          path: "/",
          headers: {
            "content-type": "application/json; charset=utf-8",
          },
        }
      : {
          agent,
          socketPath: port,
          method: "PUT",
          path: "/",
          headers: {
            "content-type": "application/json; charset=utf-8",
          },
        };
  return (json, discarded) =>
    new global_Promise((resolve) => {
      let request = makeRequest(options);
      // console.log(request);
      request.on("error", onRequestError);
      request.on("response", (response) => {
        // console.log(response);
        response.setEncoding("utf8");
        let body = "";
        response.on("data", (data) => {
          body += data;
        });
        response.on("error", onResponseError);
        response.on("end", () => {
          expect(response.statusCode !== 400, body);
          assert(
            response.statusCode === 200,
            "unexpected http status code: %o",
            response.statusCode
          );
          resolve(global_JSON_parse(body));
        });
      });
      request.end(global_JSON_stringify(json), "utf8");
    });
};
