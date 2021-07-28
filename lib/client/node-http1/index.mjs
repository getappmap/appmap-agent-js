// This is necessary to avoid infinite recursion when http-hook is true
import * as Http from "http";
const { Agent, request: connect } = Http;

const _Error = Error;
const _String = String;
const { stringify } = JSON;

export default (dependencies) => {
  const {
    util: {
      noop,
      createCounter,
      createBox,
      getBox,
      setBox,
      getCounterValue,
      incrementCounter,
      decrementCounter,
    },
    uuid: { getUUID },
  } = dependencies;

  const resolveClientTermination = ({
    running,
    pending,
    termination: { resolve },
    options: { agent },
  }) => {
    if (!getBox(running) && getCounterValue(pending) === 0) {
      agent.destroy();
      resolve();
    }
  };

  const rejectClientTermination = (
    { termination: { reject }, options: { agent }, running },
    error,
  ) => {
    setBox(running, false);
    agent.destroy();
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
        new _Error(`http1 echec status code: ${_String(status)}`),
      );
    }
    response.on("error", onResponseError);
    response.on("data", onResponseData);
    response.on("end", onResponseEnd);
  }

  function onResponseData(data) {
    const { _appmap_client: client } = this;
    rejectClientTermination(
      client,
      new _Error("non empty http1 response body"),
    );
  }

  function onResponseEnd() {
    const { _appmap_client: client } = this;
    const { pending } = client;
    decrementCounter(pending);
    resolveClientTermination(client);
  }

  const createExposedPromise = () => {
    let resolve, reject;
    const promise = new Promise((_resolve, _reject) => {
      resolve = _resolve;
      reject = _reject;
    });
    return { promise, resolve, reject };
  };

  return {
    createClient: ({ host, port }) => ({
      termination: createExposedPromise(),
      head: getUUID(),
      pending: createCounter(0),
      running: createBox(true),
      options: {
        agent: new Agent({ keepAlive: true }),
        ...(typeof port === "number" ? { host, port } : { socketPath: port }),
        method: "PUT",
        path: "/",
        headers: {
          "content-type": "application/json; charset=utf-8",
        },
      },
    }),
    initializeClient: noop,
    sendClient: (client, data) => {
      const { running, pending, head, options } = client;
      if (getBox(running)) {
        incrementCounter(pending);
        const request = connect(options);
        request._appmap_client = client;
        request.on("error", onRequestError);
        request.on("response", onRequestResponse);
        request.end(stringify({ head, body: data }), "utf8");
      }
    },
    asyncClientTermination: ({ termination: { promise } }) => promise,
    terminateClient: (client) => {
      const { running } = client;
      setBox(running, false);
      resolveClientTermination(client);
    },
  };
};
