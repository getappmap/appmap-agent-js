import * as Http2 from "http2";
import { noop } from "../../../util/index.mjs";

const global_String = String;
const global_Error = Error;
const global_JSON_stringify = JSON.stringify;

// This is necessary to avoid infinite recursion when http2-hook is true
const Http2_connect = Http2.connect;

export default (dependencies, { host, port }) => ({
  initializeClient: () => {
    const session =
      typeof port === "number"
        ? Http2_connect(`http://${host}:${global_String(port)}/`)
        : Http2_connect(`http://localhost/`, { path: port });
    session.unref();
    return {
      termination: new Promise((resolve, reject) => {
        session.on("error", (error) => {
          session.destroy();
          reject(error);
        });
        session.on("close", resolve);
      }),
      handle: {
        session,
        headers: {
          ":method": "PUT",
          ":path": `/`,
          "content-type": "application/json; charset=utf-8",
        },
        onRequestData: (data) => {
          session.emit(
            "error",
            new global_Error("non empty http2 response body"),
          );
        },
        onRequestResponse: ({ ":status": status }) => {
          if (status !== 200) {
            session.emit(
              "error",
              new global_Error(
                `http2 echec status code: ${global_String(status)}`,
              ),
            );
          }
        },
        onRequestError: (error) => {
          session.emit("error", error);
        },
        onRequestFrameError: (type, code, id) => {
          session.emit(
            "error",
            new global_Error(
              `frame error ${global_JSON_stringify({ type, code, id })}`,
            ),
          );
        },
      },
    };
  },
  terminateClient: ({ session }) => session.close(),
  sendClient: (
    {
      session,
      headers,
      onRequestError,
      onRequestFrameError,
      onRequestResponse,
      onRequestData,
    },
    data,
  ) => {
    const request = session.request(headers);
    request.on("error", onRequestError);
    request.on("frameError", onRequestFrameError);
    request.on("response", onRequestResponse);
    request.on("data", onRequestData);
    request.on("end", noop);
    request.end(global_JSON_stringify(data), "utf8");
  },
});
