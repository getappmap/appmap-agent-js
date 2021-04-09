const { connect } = require("http2");

const global_String = String;
const global_Error = Error;
const global_JSON_stringify = JSON.stringify;
const global_JSON_parse = JSON.parse;

const noop = () => {};

const checkStatus = function (headers) {
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
  const session = connect(`http://${host}:${port}`);
  const headers = {
    ":method": "PUT",
    ":path": `/`,
    "content-type": "application/json; charset=utf-8",
  };
  return (data, pending) => {
    const request = session.request(headers);
    request.setEncoding("utf8");
    if (pending === null) {
      request.on("response", checkStatus);
    } else {
      let body = "";
      let status;
      request.on("error", pending.reject);
      request.on("response", (headers) => {
        status = headers[":status"];
      });
      request.on("data", (data) => (body += data));
      request.on("end", () => {
        if (status !== 200) {
          reject(new Error(`http status ${global_String(status)} >> ${body}`));
        } else {
          let json;
          try {
            json = global_JSON_parse(body);
          } catch (error) {
            reject(error);
          }
          resolve(json);
        }
      });
    }
    request.end(global_JSON_stringify(data));
  };
};
