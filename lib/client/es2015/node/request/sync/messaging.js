const PosixSocket = require("posix-socket");
const PosixSocketMessaging = require("posix-socket-messaging");
// const { wrap, unwrap } = require("./wrapping.js");

const global_Error = Error;
const global_JSON_parse = JSON.parse;
const global_JSON_stringify = JSON.stringify;

module.exports = (host, port) => {
  let sockfd;
  if (typeof port === "number") {
    sockfd = PosixSocket.socket(
      PosixSocket.AF_INET,
      PosixSocket.SOCK_STREAM,
      0
    );
    PosixSocket.connect(sockfd, {
      sin_family: 2,
      sin_addr: host === "localhost" ? "127.0.0.1" : host,
      sin_port: port,
    });
  } else {
    sockfd = PosixSocket.socket(PosixSocket.AF_UNIX, PosixSocket.SOCK_STREAM);
    PosixSocket.connect(sockfd, {
      sun_family: 1,
      sun_path: port,
    });
  }
  return (json) => {
    PosixSocketMessaging.send(
      sockfd,
      global_JSON_stringify({ index: 0, query: json })
    );
    json = global_JSON_parse(PosixSocketMessaging.receive(sockfd));
    // if (json.index !== 0) throw new global_Error(`Invalid index`);
    if (json.failure !== null) {
      throw new global_Error(json.failure);
    }
    return json.success;
  };
};
