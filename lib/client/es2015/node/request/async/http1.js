const Http = require("http");

const global_Error = Error;
const global_JSON_stringify = JSON.stringify;
const global_JSON_parse = JSON.parse;
const global_String = String;

module.exports = (host, port, callback) => {
  const agent = new Http.Agent({
    keepAlive: true
  });
  const assume200NullBody = (response) => {
    let body = "";
    response.setEncoding("utf8");
    response.on("data", (data) => {
      body += data;
    });
    response.on("end", () => {
      if (response.statusCode !== 200) {
        return callback(new Error(`http ${global_String(response.statusCode)} >> ${body}`));
      }
      if (body !== "null") {
        return callback(new Error(`Unexpected non-null success`));
      }
      return callback(null);
    });
  };
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
  return (json1, pending) => {
    const request = Http.request(options);
    if (pending === null) {
      request.on("response", assume200NullBody);
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
            return pending.reject(
              new global_Error(
                `http ${global_String(response.statusCode)} >> ${body}`
              )
            );
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
    }
    request.end(global_JSON_stringify(json1), "utf8");
  };
};
