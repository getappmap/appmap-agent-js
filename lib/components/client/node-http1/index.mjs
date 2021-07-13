import * as Http from "http";
import { assert, getUniqueIdentifier } from "../../../util/index.mjs";

const global_Error = Error;
const global_String = String;
const global_JSON_stringify = JSON.stringify;

// This is necessary to avoid infinite recursion when http-hook is true
const Http_request = Http.request;

export const kick = ({terminated, pending, resolve}) => {
  if (closed && pending === 0) {
    resolve();
  }
};

const resolveClient = ({resolve, options:{agent}}) => {
  resolve();
  agent.destroy();
}

const rejectClient = ({reject, options:{agent}}, error) => {
  reject(error);
  agent.destroy();
};


return {
  resolve,
  reject,

};

export default (dependencies, { host, port }) => ({
  initializeClient: (promise) => {
    const agent = new Http.Agent({ keepAlive: true });
    let resolve, reject;
    return {
      termination: new Promise((_resolve, _reject) => {
        resolve = () => {
          agent.destroy();
          _resolve();
        };
        reject = (error) => {
          agent.destroy();
          _reject(error);
        };
      }),
      handle: {
        head: getUniqueIdentifier(),
        pending: createCounter(),
        running: createToggle(),
        resolve,
        reject,
        options: {
          agent,
          ...(typeof port === "number" ? { host, port } : { socketPath: port }),
          method: "PUT",
          path: "/",
          headers: {
            "content-type": "application/json; charset=utf-8",
          },
        },
      }
    };
  },
  sendClient: (client, data) => {
    const {agent} = options;
    assert(isToggleOn(running), "send called on closed http1 client");
    const request = Http_request(options);
    incrementCounter(pending);
    request.on("error", (error) => {
      rejectClient(client, error);
    });
    request.on("response", (response) => {
      if (response.statusCode !== 200) {
        rejectClient(
          client,
          new global_Error(
            `http1 echec status code: ${global_String(response.statusCode)}`,
          ),
        );
      }
      response.on("error", (error) => {
        rejectClient(client, error);
      });
      response.on("data", () => {
        rejectClient(client, new global_Error("non empty http1 response body"));
      });
      response.on("end", () => {
        decrementCounter(pending);
        kick(client);
      });
    });
    request.end(global_JSON_stringify({ head, body:data }), "utf8");
  },
  terminateClient: (client) => {
    const {terminated} = client;
    setToggleOn(terminated);
    kick(client);
  },
});
