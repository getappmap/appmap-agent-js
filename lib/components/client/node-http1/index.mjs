import * as Http from "http";
import { assert, getUniqueIdentifier } from "../../../util/index.mjs";

const global_Error = Error;
const global_String = String;
const global_JSON_stringify = JSON.stringify;

// This is necessary to avoid infinite recursion when http-hook is true
const Http_request = Http.request;

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
    let closed = false;
    let pending = 0;
    const onResponse = (response) => {
      if (response.statusCode !== 200) {
        reject(
          new global_Error(
            `http1 echec status code: ${global_String(response.statusCode)}`,
          ),
        );
        agent.destroy();
      }
      response.on("error", reject);
      response.on("data", onReponseData);
      response.on("end", onResponseEnd);
    };
    const onReponseData = (data) => {
      reject(new global_Error("non empty http1 response body"));
    };
    const kick = () => {
      if (closed && pending === 0) {
        resolve();
      }
    };
    const onResponseEnd = () => {
      pending -= 1;
      kick();
    };
    let resolve, reject;
    return {
      life: new Promise((_resolve, _reject) => {
        resolve = () => {
          agent.destroy();
          _resolve();
        };
        reject = (error) => {
          agent.destroy();
          _reject(error);
        };
      }),
      send: (body) => {
        assert(!closed, "send called on closed http1 client");
        const request = Http_request(options);
        pending += 1;
        request.on("error", reject);
        request.on("response", onResponse);
        request.end(global_JSON_stringify({ head, body }), "utf8");
      },
      close: () => {
        closed = true;
        kick();
      },
    };
  },
});
