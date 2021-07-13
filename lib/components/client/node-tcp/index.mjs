import { Socket } from "net";
import { patch } from "net-socket-messaging";

const global_JSON_stringify = JSON.stringify;

export const (resolve, reject) => {
  return {
    resolve,
    reject,
  }
};

export const getTermination = (socket) =>

await getClientTermination(handle);

export default (dependencies, { host, port }) => ({
  initializeClient: () => {
    const socket = new Socket({allowHalfOpen:true});
    socket.connect(...(typeof port === "string" ? [port] : [port, host]));
    socket.unref();
    patch(socket);
    return socket;
  },
  terminateClient: (socket) => socket.end(),
  checkClientTerminationAsync: (socket) => new Promise((resolve, reject) => {
    socket.on("error", reject);
    socket.on("close", resolve);
  }),
  sendClient: (socket, data) => socket.send(global_JSON_stringify(data)),
});
