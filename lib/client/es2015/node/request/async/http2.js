const { connect } = require("http2");

const global_String = String;
const global_Error = Error;
const global_JSON_stringify = JSON.stringify;
const global_JSON_parse = JSON.parse;

const noop = () => {};

const checkStatus = function checkStatus(headers) {
  if (headers[":status"] === 200) {
    this.on("data", noop);
    this.on("end", noop);
  } else {
    let body = "";
    this.setEncoding("utf8");
    this.on("data", (data) => {
      body += data;
    });
    this.on("end", () => {
      throw new global_Error(
        `http status ${global_String(headers[":status"])}: ${body}`
      );
    });
  }
};

module.exports = (host, port) => {
  const session = typeof port === "number" ?
    connect(`http://${host}:${global_String(port)}/`) :
    connect(`http://localhost/`, {path:port});
  const headers1 = {
    ":method": "PUT",
    ":path": `/`,
    "content-type": "application/json; charset=utf-8",
  };
  return (json1, pending) => {
    const request = session.request(headers1);
    request.setEncoding("utf8");
    if (pending === null) {
      request.on("response", checkStatus);
    } else {
      let body = "";
      let status;
      request.on("error", pending.reject);
      request.on("response", (headers2) => {
        status = headers2[":status"];
      });
      request.on("data", (data) => {
        body += data;
      });
      request.on("end", () => {
        if (status !== 200) {
          pending.reject(
            new Error(`http status ${global_String(status)} >> ${body}`)
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
    }
    request.end(global_JSON_stringify(json1));
  };
};
