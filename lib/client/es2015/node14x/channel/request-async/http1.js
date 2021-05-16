const Http = require("http");

const global_Promise = Promise;
const global_Error = Error;
const global_JSON_stringify = JSON.stringify;
const global_JSON_parse = JSON.parse;
const global_String = String;

exports.makeRequestAsync = (host, port, callback) => {
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
  return (json1, discarded) =>
    new global_Promise((resolve, reject) => {
      const request = Http.request(options);
      request.on("error", reject);
      request.on("response", (response) => {
        response.setEncoding("utf8");
        let body = "";
        response.on("data", (data) => {
          body += data;
        });
        response.on("error", reject);
        response.on("end", () => {
          if (response.statusCode !== 200) {
            return reject(
              new global_Error(
                `http ${global_String(response.statusCode)} >> ${body}`
              )
            );
          }
          let json2;
          try {
            json2 = global_JSON_parse(body);
          } catch (error) {
            return reject(error);
          }
          return resolve(json2);
        });
      });
      request.end(global_JSON_stringify(json1), "utf8");
    });
};
