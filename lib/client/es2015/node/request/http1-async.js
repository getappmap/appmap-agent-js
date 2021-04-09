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
  const options = {
    host,
    port,
    method: "PUT",
    path: "/",
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  };
  return (json1, pending) => {
    const request = connect(options);
    if (pending === null) {
      request.on("response", discard);
    } else {
      request.on("error", pending.reject);
      request.on("response", (response) => {
        response.setEncoding("utf8");
        let body = "";
        response.on("data", (data) => {
          body += data;
        });
        response.on("error", pending.reject);
        response.on("end", () => {
          if (response.statusCode !== 200) {
            pending.reject(
              new global_Error(
                `http status ${global_String(response.statusCode)}: ${body}`
              )
            );
          } else {
            let json2;
            try {
              json2 = global_JSON_parse(body);
            } catch (error) {
              pending.reject(error);
            }
            pending.resolve(json2);
          }
        });
      });
    }
    request.end(global_JSON_stringify(json1), "utf8");
  };
};
