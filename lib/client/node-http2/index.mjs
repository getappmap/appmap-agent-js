import * as Http2 from "http2";
// This is necessary to avoid infinite recursion when http2-hook is true
const { connect } = Http2;

const global_String = String;
const global_Error = Error;
const { stringify: global_JSON_stringify } = JSON;

export default (dependencies) => {
  const {
    util: { noop },
  } = dependencies;

  const headers = {
    ":method": "PUT",
    ":path": `/`,
    "content-type": "application/json; charset=utf-8",
  };

  /* c8 ignore start */

  function onStreamError(error) {
    this.session.emit("error", error);
  }

  function onStreamFrameError(type, code, id) {
    this.session.emit(
      "error",
      new global_Error(
        `frame error ${global_JSON_stringify({ type, code, id })}`,
      ),
    );
  }

  /* c8 ignore stop */

  function onStreamResponse({ ":status": status }) {
    if (status !== 200) {
      this.session.emit(
        "error",
        new global_Error(`http2 echec status code: ${global_String(status)}`),
      );
    }
  }

  function onStreamData(data) {
    this.session.emit(
      "error",
      new global_Error("non empty http2 response body"),
    );
  }

  function onSessionError(error) {
    this.close();
  }

  return {
    initializeClient: ({ host, port }) => {
      const session =
        typeof port === "number"
          ? connect(`http://${host}:${global_String(port)}/`)
          : connect(`http://localhost/`, { path: port });
      session.unref();
      session.on("error", onSessionError);
      return {
        session,
        termination: new Promise((resolve, reject) => {
          session.on("error", reject);
          session.on("close", resolve);
        }),
      };
    },
    awaitClientTermination: ({ termination }) => termination,
    terminateClient: ({ session }) => session.close(),
    sendClient: ({ session }, data) => {
      const stream = session.request(headers);
      stream.on("error", onStreamError);
      stream.on("frameError", onStreamFrameError);
      stream.on("response", onStreamResponse);
      stream.on("data", onStreamData);
      stream.on("end", noop);
      stream.end(global_JSON_stringify(data), "utf8");
    },
  };
};
