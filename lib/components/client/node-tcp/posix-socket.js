const PosixSocket = require("posix-socket");
const PosixSocketMessaging = require("posix-socket-messaging");
const { assert, expect, expectSuccess } = require("../../check.js");

const global_JSON_parse = JSON.parse;
const global_JSON_stringify = JSON.stringify;

export const connect = (host, port) => {
  let sockfd;
  let options;
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
    options = {
      sin_family: 2,
      sin_addr: host === "localhost" ? "127.0.0.1" : host,
      sin_port: port,
    };
  } else {
    expect(host === "localhost" || host === "127.0.0.1", "host should be local host when provided a unix domain socket");
    sockfd = PosixSocket.socket(
      PosixSocket.AF_UNIX,
      PosixSocket.SOCK_STREAM,
      0
    );
    options = {
      sun_family: 1,
      sun_path: port,
    };
  }
  expectSuccess(
    () => PosixSocket.connect(sockfd, options),
    "failed to connect socket: %o to: %j >> %s",
    sockfd,
    options
  );
  return sockfd;
};

export const close = PosixSocketMessaging.close;

const send = (sockfd, head, body) => {
  expectSuccess(
    () => PosixSocketMessaging.send(sockfd, JSON.stringify({
      head: null,
      body: data
    })),
    "failed to send message to socket: %o >>",
    sockfd
  );
};

export const send = (sockfd, data) => {
  send(sockfd, null, data);
};

export const request = (sockfd, data) => {
  send(sockfd, 0, data);
  const message = expectSuccess(
    () => PosixSocketMessaging.receive(sockfd),
    "failed to receive message to socket: %o >>",
    sockfd
  );
  json = global_JSON_parse(message);
  expect(json.type === "right", "%s", json.body);
  return json.body;
};

exports.initializePosixSocket = (host, port) => {
  let sockfd;
  let options;
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
    options = {
      sin_family: 2,
      sin_addr: host === "localhost" ? "127.0.0.1" : host,
      sin_port: port,
    };
  } else {
    expect(host === "localhost" || host === "127.0.0.1", "host should be local host when provided a unix domain socket");
    sockfd = PosixSocket.socket(
      PosixSocket.AF_UNIX,
      PosixSocket.SOCK_STREAM,
      0
    );
    options = {
      sun_family: 1,
      sun_path: port,
    };
  }
  expectSuccess(
    () => PosixSocket.connect(sockfd, options),
    "failed to connect socket: %o to: %j >> %s",
    sockfd,
    options
  );
  return {
    run (json, discarded = false) => {
      let message = global_JSON_stringify({
        head: discarded ? null : 0,
        body: json,
      });
      expectSuccess(
        () => PosixSocketMessaging.send(sockfd, message),
        "failed to send message to socket: %o >>",
        sockfd
      );
      if (discarded) {
        return null;
      }
      message = expectSuccess(
        () => PosixSocketMessaging.receive(sockfd),
        "failed to receive message to socket: %o >>",
        sockfd
      );
      json = global_JSON_parse(message);
      expect(json.type !== "left", json.body);
      assert(json.type === "right", "invalid type field: %o", json.type);
      return json.body;
    },
    terminate: () => {
      PosixSocketMessaging.close(sockfd);
    }
  };
};
