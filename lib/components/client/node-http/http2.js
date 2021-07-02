const Http2 = require("http2");
const { assert, expect } = require("../../check.js");
const { makeErrorHandler } = require("./error.js");

const global_String = String;
const global_JSON_stringify = JSON.stringify;
const global_JSON_parse = JSON.parse;
const global_Promise = Promise;

// This is necessary to avoid infinite recursion when http2-hook is true
const makeSession = Http2.connect;

const onRequestError = makeErrorHandler("http2 request");

const onSessionError = makeErrorHandler("http2 session");

exports.initializeHttp2 = (host, port) => {
  const session =
    typeof port === "number"
      ? makeSession(`http://${host}:${global_String(port)}/`)
      : makeSession(`http://localhost/`, { path: port });
  session.unref();
  session.on("error", onSessionError);
  let counter = 0;
  const headers1 = {
    ":method": "PUT",
    ":path": `/`,
    "content-type": "application/json; charset=utf-8",
  };
  return {
    runAsync: (json, discarded) =>
      new global_Promise((resolve) => {
        if (counter === 0) {
          session.ref();
        }
        counter += 1;
        let body = "";
        let status;
        const request = session.request(headers1);
        request.setEncoding("utf8");
        request.on("error", onRequestError);
        request.on("response", (headers2) => {
          status = headers2[":status"];
        });
        request.on("data", (data) => {
          body += data;
        });
        request.on("end", () => {
          counter -= 1;
          if (counter === 0) {
            session.unref();
          }
          expect(status !== 400, body);
          assert(status === 200, "unexpected http status code: %o", status);
          resolve(global_JSON_parse(body));
        });
        request.end(global_JSON_stringify(json));
      }),
    terminate: () => {
      client.close();
    }
  };
};
