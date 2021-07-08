import * as Http from "http";
import {
  deadcode,
  assert,
  expectDeadcode,
  noop,
  getUniqueIdentifier,
} from "../../../util/index.mjs";

const global_JSON_stringify = JSON.stringify;

// This is necessary to avoid infinite recursion when http-hook is true
const Http_request = Http.request;

const onRequestError = expectDeadcode("http1 request failure >> %e");

const onResponseError = expectDeadcode("http1 response failure >> %e");

const onReponseData = deadcode("non-empty http1 response body");

const onResponse = (response) => {
  assert(response.statusCode === 200, "non 200 http1 status");
  response.on("error", onResponseError);
  response.on("data", onReponseData);
  response.on("end", noop);
};

export default (dependencies, { host, port }) => ({
  open: () => {
    const head = getUniqueIdentifier();
    const agent = new Http.Agent({ keepAlive: true });
    const options = {
      agent,
      ...(typeof port === "number" ? { host, port } : { socketPath: port }),
      method: "PUT",
      path: "/",
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
    };
    return {
      send: (body) => {
        const request = Http_request(options);
        request.on("error", onRequestError);
        request.on("response", onResponse);
        request.end(global_JSON_stringify({ head, body }), "utf8");
      },
      close: () => {
        agent.destroy();
      },
    };
  },
});
