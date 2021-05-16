const PosixSocket = require("posix-socket");
const PosixSocketMessaging = require("posix-socket-messaging");
// const { wrap, unwrap } = require("./wrapping.js");

const global_Error = Error;
const global_JSON_parse = JSON.parse;
const global_JSON_stringify = JSON.stringify;

exports.makeRequest = (host, port) => {
  let sockfd;
  if (typeof port === "number") {
    sockfd = PosixSocket.socket(
      PosixSocket.AF_INET,
      PosixSocket.SOCK_STREAM,
      0
    );
    PosixSocket.setsockopt(
      sockfd,
      PosixSocket.IPPROTO_TCP,
      PosixSocket.TCP_NODELAY,
      1
    );
    PosixSocket.connect(sockfd, {
      sin_family: 2,
      sin_addr: host === "localhost" ? "127.0.0.1" : host,
      sin_port: port,
    });
  } else {
    sockfd = PosixSocket.socket(
      PosixSocket.AF_UNIX,
      PosixSocket.SOCK_STREAM,
      0
    );
    PosixSocket.connect(sockfd, {
      sun_family: 1,
      sun_path: port,
    });
  }
  return (json) => {
    PosixSocketMessaging.send(
      sockfd,
      global_JSON_stringify({ head: 0, body: json })
    );
    json = global_JSON_parse(PosixSocketMessaging.receive(sockfd));
    // console.assert(json.head === 0);
    if (json.type === "left") {
      throw new global_Error(json.body);
    }
    if (json.type === "right") {
      return json.body;
    }
    throw new global_Error("invalid response type");
  };
};
