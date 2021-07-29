import * as Http2 from "http2";
// This is necessary to avoid infinite recursion when http2-hook is true
const { connect } = Http2;

const _String = String;
const _Error = Error;
const { stringify } = JSON;

export default (dependencies) => {
  const {
    util: { noop, createBox, setBox, getBox },
  } = dependencies;

  const headers = {
    ":method": "PUT",
    ":path": `/`,
    "content-type": "application/json; charset=utf-8",
  };

  /* c8 ignore start */

  function onStreamError(error) {
    const { _appmap_reject: reject } = this;
    reject(error);
  }

  function onStreamFrameError(type, code, id) {
    const { _appmap_reject: reject } = this;
    reject(new _Error(`frame error ${stringify({ type, code, id })}`));
  }

  /* c8 ignore stop */

  function onStreamResponse({ ":status": status }) {
    if (status !== 200) {
      const { _appmap_reject: reject } = this;
      reject(new _Error(`http2 echec status code: ${_String(status)}`));
    }
  }

  function onStreamData(data) {
    const { _appmap_reject: reject } = this;
    reject(new _Error("non empty http2 response body"));
  }

  return {
    createClient: () => createBox(null),
    executeClientAsync: async (box, { host, port }) => {
      const session =
        typeof port === "number"
          ? connect(`http://${host}:${_String(port)}/`)
          : connect(`http://localhost/`, { path: port });
      session.unref();
      try {
        await new Promise((resolve, reject) => {
          setBox(box, { session, reject });
          session.on("error", reject);
          session.on("close", resolve);
        });
      } finally {
        session.destroy();
      }
    },
    interruptClient: (box) => {
      // session.close seems to destroy streams created
      // during the current event processing so we need
      // to postpone to the next event tick.
      setTimeout(() => {
        const { session } = getBox(box);
        session.close();
      });
    },
    sendClient: (box, data) => {
      const { session, reject } = getBox(box);
      const stream = session.request(headers);
      stream._appmap_reject = reject;
      stream.on("error", onStreamError);
      stream.on("frameError", onStreamFrameError);
      stream.on("response", onStreamResponse);
      stream.on("data", onStreamData);
      stream.on("end", noop);
      stream.end(stringify(data), "utf8");
    },
  };
};
