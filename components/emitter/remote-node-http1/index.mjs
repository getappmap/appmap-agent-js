// This namespace import is necessary to avoid infinite recursion when http-hook is true
import * as Http from "http";
const { Agent, request: connect } = Http;

const {
  Error,
  String,
  JSON: {stringify:stringifyJSON},
  Promise,
} = globalThis;

export default (dependencies) => {
  const {
    util: {
      assert,
      createCounter,
      createBox,
      getBox,
      setBox,
      gaugeCounter,
      incrementCounter,
      decrementCounter,
    },
    uuid: { getUUID },
  } = dependencies;

  const resolveClientTermination = ({ running, pending, interrupt }) => {
    if (!getBox(running) && gaugeCounter(pending) === 0) {
      const { resolve } = getBox(interrupt);
      resolve();
    }
  };

  const rejectClientTermination = ({ interrupt, running }, error) => {
    assert(getBox(running) === true, "client is not running");
    setBox(running, false);
    const { reject } = getBox(interrupt);
    reject(error);
  };

  /* c8 ignore start */

  function onRequestError(error) {
    const { _appmap_client: client } = this;
    rejectClientTermination(client, error);
  }

  function onResponseError(error) {
    const { _appmap_client: client } = this;
    rejectClientTermination(client, error);
  }

  /* c8 ignore stop */

  function onRequestResponse(response) {
    const { _appmap_client: client } = this;
    const { statusCode: status } = response;
    response._appmap_client = client;
    if (status !== 200) {
      rejectClientTermination(
        client,
        new Error(`http1 echec status code: ${String(status)}`),
      );
    }
    response.on("error", onResponseError);
    response.on("data", onResponseData);
    response.on("end", onResponseEnd);
  }

  function onResponseData(_data) {
    const { _appmap_client: client } = this;
    rejectClientTermination(
      client,
      new Error("non empty http1 response body"),
    );
  }

  function onResponseEnd() {
    const { _appmap_client: client } = this;
    const { pending } = client;
    decrementCounter(pending);
    resolveClientTermination(client);
  }

  return {
    createClient: ({ host, port }) => ({
      head: getUUID(),
      pending: createCounter(0),
      running: createBox(true),
      interrupt: createBox(null),
      options: {
        agent: new Agent({ keepAlive: true }),
        method: "PUT",
        ...(typeof port === "number" ? { host, port } : { socketPath: port }),
        path: "/",
        headers: {
          "content-type": "application/json; charset=utf-8",
        },
      },
    }),
    executeClientAsync: async ({ interrupt, options: { agent } }) => {
      try {
        await new Promise((resolve, reject) => {
          assert(getBox(interrupt) === null, "client is already running");
          setBox(interrupt, { resolve, reject });
        });
      } finally {
        agent.destroy();
      }
    },
    interruptClient: (client) => {
      const { running } = client;
      assert(getBox(running) === true, "client is not running");
      setBox(running, false);
      resolveClientTermination(client);
    },
    traceClient: (client, data) => {
      const { running, pending, head, options } = client;
      if (getBox(running) && data !== null) {
        incrementCounter(pending);
        const request = connect(options);
        request._appmap_client = client;
        request.on("error", onRequestError);
        request.on("response", onRequestResponse);
        request.end(stringifyJSON({ head, body: data }), "utf8");
      }
    },
  };
};
