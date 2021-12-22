import Module from "module";
const require = Module.createRequire(import.meta.url);

export default (dependencies) => {
  const {
    log: { logDebug },
  } = dependencies;
  const tryRequire = (name) => {
    try {
      return require(name);
    } catch (error) {
      logDebug("Could not load module: %j >> %e", name, error);
      return null;
    }
  };
  const PosixSocket = tryRequire("posix-socket");
  const PosixSocketMessaging = tryRequire("posix-socket-messaging");
  if (PosixSocket !== null && PosixSocketMessaging !== null) {
    const {
      AF_INET,
      AF_UNIX,
      SOCK_STREAM,
      socket: createSocket,
      connect: connectSocket,
      // shutdown: shutdownSocket,
      close: closeSocket,
    } = PosixSocket;
    const { send: sendSocket } = PosixSocketMessaging;
    return {
      openSocket: (host, port) => {
        const fd = createSocket(
          typeof port === "number" ? AF_INET : AF_UNIX,
          SOCK_STREAM,
          0,
        );
        connectSocket(
          fd,
          typeof port === "number"
            ? { sin_family: AF_INET, sin_port: port, sin_addr: host }
            : { sun_family: AF_UNIX, sun_path: port },
        );
        return fd;
      },
      closeSocket,
      sendSocket,
    };
  } else {
    return null;
  }
};
