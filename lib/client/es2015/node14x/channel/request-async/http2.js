const { connect } = require("http2");

const global_String = String;
const global_Error = Error;
const global_JSON_stringify = JSON.stringify;
const global_JSON_parse = JSON.parse;
const global_Promise = Promise;

exports.makeRequestAsync = (host, port, callback) => {
  const session =
    typeof port === "number"
      ? connect(`http://${host}:${global_String(port)}/`)
      : connect(`http://localhost/`, { path: port });
  session.unref();
  let counter = 0;
  const headers1 = {
    ":method": "PUT",
    ":path": `/`,
    "content-type": "application/json; charset=utf-8",
  };
  return (json1, discarded) =>
    new global_Promise((resolve, reject) => {
      if (counter === 0) {
        session.ref();
      }
      counter += 1;
      let body = "";
      let status;
      const request = session.request(headers1);
      request.setEncoding("utf8");
      request.on("error", reject);
      request.on("error", reject);
      request.on("response", (headers2) => {
        status = headers2[":status"];
      });
      request.on("data", (data) => {
        body += data;
      });
      request.on("end", () => {
        counter -= 1;
        if (counter === 0) {
          session.unref();
        }
        if (status !== 200) {
          return reject(
            new global_Error(`http ${global_String(status)} >> ${body}`)
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
      request.end(global_JSON_stringify(json1));
    });
};
