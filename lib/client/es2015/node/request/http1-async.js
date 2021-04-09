const { request: connect } = require("http");
const global_Error = Error;
const global_JSON_stringify = JSON.stringify;
const global_JSON_parse = JSON.parse;
const global_String = String;

const noop = () => {};

const discard = (response) => {
  if (response.statusCode !== 200) {
    let body = "";
    response.setEncoding("utf8");
    response.on("data", (data) => {
      body += data;
    });
    response.on("end", () => {
      throw new global_Error(
        `http status ${global_String(response.statusCode)}: ${body}`
      );
    });
  } else {
    response.on("data", noop);
    response.on("end", noop);
  }
};

module.exports = (host, port) => {
  const cache = { __proto__: null };
  const options = {
    host,
    port,
    method: "PUT",
    path: `/${name}`,
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  };
  return (data, pending) => {
    const request = connect(options);
    if (pending === null) {
      request.on("response", discard);
    } else {
      request.on("error", pending.reject);
      request.on("response", (response) => {
        response.setEncoding("utf8");
        let result = "";
        response.on("data", (data) => {
          result += data;
        });
        response.on("error", pending.reject);
        response.on("end", () => {
          if (response.statusCode !== 200) {
            return pending.reject(
              new global_Error(
                `http status ${global_String(response.statusCode)}: ${body}`
              )
            );
          }
          try {
            pending.resolve(global_JSON_parse(result));
          } catch (error) {
            pending.reject(error);
          }
        });
      });
    }
    request.end(global_JSON_stringify(data), "utf8");
  };
};
