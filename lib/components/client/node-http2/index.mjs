import * as Http2 from "http2";
import {
  deadcode,
  expectDeadcode,
  assert,
  getUniqueIdentifier,
  noop,
} from "../../../util/index.mjs";

const global_String = String;
const global_JSON_stringify = JSON.stringify;

// This is necessary to avoid infinite recursion when http2-hook is true
const Http2_connect = Http2.connect;

const onRequestData = deadcode("non-empty http2 response body");

const onSessionError = expectDeadcode("http2 session error >> %e");

const onRequestError = expectDeadcode("http2 request error >> %e");

const onRequestResponse = (headers) => {
  assert(headers[":status"] === 200, "non 200 http2 status");
};

export default (dependencies, { host, port }) => ({
  open: () => {
    const head = getUniqueIdentifier();
    const session =
      typeof port === "number"
        ? Http2_connect(`http://${host}:${global_String(port)}/`)
        : Http2_connect(`http://localhost/`, { path: port });
    session.unref();
    session.on("error", onSessionError);
    const headers1 = {
      ":method": "PUT",
      ":path": `/`,
      "content-type": "application/json; charset=utf-8",
    };
    return {
      send: (body) => {
        const request = session.request(headers1);
        request.on("error", onRequestError);
        request.on("response", onRequestResponse);
        request.on("data", onRequestData);
        request.on("end", noop);
        request.end(global_JSON_stringify({ head, body }), "utf8");
      },
      close: () => {
        session.close();
      },
    };
  },
});
