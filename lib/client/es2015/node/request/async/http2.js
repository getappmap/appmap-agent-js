const { connect } = require("http2");

const global_String = String;
const global_Error = Error;
const global_JSON_stringify = JSON.stringify;
const global_JSON_parse = JSON.parse;

module.exports = (host, port, callback) => {
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
  const defaultPending = {
    reject: callback,
    resolve: (json) => {
      callback(
        json === null ? null : new global_Error(`Unexpected non-null response`)
      );
    },
  };
  return (json1, pending) => {
    if (counter === 0) {
      session.ref();
    }
    counter += 1;
    if (pending === null) {
      pending = defaultPending;
    }
    let body = "";
    let status;
    const request = session.request(headers1);
    request.setEncoding("utf8");
    request.on("error", pending.reject);
    request.on("error", pending.reject);
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
        return pending.reject(
          new Error(`http ${global_String(status)} >> ${body}`)
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
    request.end(global_JSON_stringify(json1));
  };
};
