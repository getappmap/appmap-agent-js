// This is necessary to avoid infinite recursion when http-hook is true

import { Agent, request as connect } from "http";
import {
  createCounter,
  createToggle,
  getUniqueIdentifier,
  isToggleOn,
  isToggleOff,
  setToggleOff,
  getCounterValue,
  incrementCounter,
  decrementCounter,
  createExposedPromise,
} from "../../../util/index.mjs";

const global_Error = Error;
const global_String = String;
const { stringify: global_JSON_stringify } = JSON;

export const resolveClientTermination = ({
  running,
  pending,
  termination: { resolve },
  options: { agent },
}) => {
  if (isToggleOff(running) && getCounterValue(pending) === 0) {
    agent.destroy();
    resolve();
  }
};

const rejectClientTermination = (
  { termination: { reject }, options: { agent }, running },
  error,
) => {
  setToggleOff(running);
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
      new global_Error(`http1 echec status code: ${global_String(status)}`),
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
    new global_Error("non empty http1 response body"),
  );
}

function onResponseEnd() {
  const { _appmap_client: client } = this;
  const { pending } = client;
  decrementCounter(pending);
  resolveClientTermination(client);
}

const initializeClient = (options) => {
  const { host, port } = {
    host: "localhost",
    port: 0,
    ...options,
  };
  return {
    termination: createExposedPromise(),
    head: getUniqueIdentifier(),
    pending: createCounter(0),
    running: createToggle(true),
    options: {
      agent: new Agent({ keepAlive: true }),
      ...(typeof port === "number" ? { host, port } : { socketPath: port }),
      method: "PUT",
      path: "/",
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
    },
  };
};

const sendClient = (client, data) => {
  const { running, pending, head, options } = client;
  if (isToggleOn(running)) {
    incrementCounter(pending);
    const request = connect(options);
    request._appmap_client = client;
    request.on("error", onRequestError);
    request.on("response", onRequestResponse);
    request.end(global_JSON_stringify({ head, body: data }), "utf8");
  }
};

const awaitClientTermination = ({ termination: { promise } }) => promise;

const terminateClient = (client) => {
  const { running } = client;
  setToggleOff(running);
  resolveClientTermination(client);
};

export default ({}) => ({
  initializeClient,
  sendClient,
  awaitClientTermination,
  terminateClient,
});
