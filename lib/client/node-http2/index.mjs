import * as Http2 from "http2";
// This is necessary to avoid infinite recursion when http2-hook is true
const { connect } = Http2;

const { defineProperty } = Reflect;
const _String = String;
const _Error = Error;
const { stringify } = JSON;

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
      new _Error(`frame error ${stringify({ type, code, id })}`),
    );
  }

  /* c8 ignore stop */

  function onStreamResponse({ ":status": status }) {
    if (status !== 200) {
      this.session.emit(
        "error",
        new _Error(`http2 echec status code: ${_String(status)}`),
      );
    }
  }

  function onStreamData(data) {
    this.session.emit("error", new _Error("non empty http2 response body"));
  }

  function onSessionError(error) {
    this.close();
  }

  return {
    createClient: ({ host, port }) => {
      const session =
        typeof port === "number"
          ? connect(`http://${host}:${_String(port)}/`)
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
    initializeClient: noop,
    awaitClientTermination: ({ termination }) => termination,
    terminateClient: ({ session }) => session.close(),
    sendClient: ({ session }, data) => {
      const stream = session.request(headers);
      // NB: stream.session may become undefined on error
      defineProperty(stream, "session", {
        __proto__: null,
        value: stream.session,
      });
      stream.on("error", onStreamError);
      stream.on("frameError", onStreamFrameError);
      stream.on("response", onStreamResponse);
      stream.on("data", onStreamData);
      stream.on("end", noop);
      stream.end(stringify(data), "utf8");
    },
  };
};
