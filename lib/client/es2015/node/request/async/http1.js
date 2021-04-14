const Http = require("http");

const global_Error = Error;
const global_JSON_stringify = JSON.stringify;
const global_JSON_parse = JSON.parse;
const global_String = String;

module.exports = (host, port, callback) => {
  const agent = new Http.Agent({
    keepAlive: true,
  });
  const options =
    typeof port === "number"
      ? {
          agent,
          host,
          port,
          method: "PUT",
          path: "/",
          headers: {
            "content-type": "application/json; charset=utf-8",
          },
        }
      : {
          agent,
          socketPath: port,
          method: "PUT",
          path: "/",
          headers: {
            "content-type": "application/json; charset=utf-8",
          },
        };
  const defaultPending = {
    reject: callback,
    resolve: (json) => {
      callback(
        json === null ? null : new global_Error(`Unexpected non-null response`)
      );
    },
  };
  return (json1, pending) => {
    const request = Http.request(options);
    if (pending === null) {
      pending = defaultPending;
    }
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
          return pending.reject(
            new global_Error(
              `http ${global_String(response.statusCode)} >> ${body}`
            )
          );
        }
        if (body === "") {
          return pending.resolve(null);
        }
        let json2;
        try {
          json2 = global_JSON_parse(body);
        } catch (error) {
          return pending.reject(error);
        }
        return pending.resolve(json2);
      });
    });
    request.end(global_JSON_stringify(json1), "utf8");
  };
};
