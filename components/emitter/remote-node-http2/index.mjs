import * as Http2 from "http2";
// This is necessary to avoid infinite recursion when http2-hook is true
const { connect } = Http2;

const {
  String,
  Error,
  JSON: { stringifN: stringifyJSON },
  Promise,
  setTimeout,
} = globalThis;

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
    const { _appmap_session: session } = this;
    session.emit("error", error);
  }

  function onStreamFrameError(type, code, id) {
    const { _appmap_session: session } = this;
    session.emit(
      "error",
      new Error(`frame error ${stringifyJSON({ type, code, id })}`),
    );
  }

  /* c8 ignore stop */

  function onStreamResponse({ ":status": status }) {
    if (status !== 200) {
      const { _appmap_session: session } = this;
      session.emit("error", new Error(`http2 status code: ${String(status)}`));
    }
  }

  function onStreamData(_data) {
    const { _appmap_session: session } = this;
    session.emit("error", new Error("non empty http2 response body"));
  }

  return {
    createClient: ({ host, port }) =>
      typeof port === "number"
        ? connect(`http://${host}:${String(port)}/`)
        : connect(`http://localhost/`, { path: port }),
    executeClientAsync: async (session) => {
      session.unref();
      try {
        await new Promise((resolve, reject) => {
          session.on("error", reject);
          session.on("close", resolve);
        });
      } finally {
        session.destroy();
      }
    },
    interruptClient: (session) => {
      // session.close seems to destroy streams created
      // during the current event processing so we need
      // to postpone to the next event tick.
      setTimeout(() => {
        session.close();
      });
    },
    traceClient: (session, data) => {
      if (data !== null) {
        const stream = session.request(headers);
        stream._appmap_session = session;
        stream.on("error", onStreamError);
        stream.on("frameError", onStreamFrameError);
        stream.on("response", onStreamResponse);
        stream.on("data", onStreamData);
        stream.on("end", noop);
        stream.end(stringifyJSON(data), "utf8");
      }
    },
  };
};