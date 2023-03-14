import { createServer, Socket } from "node:net";
import "../../__fixture__.mjs";
import { toIpcPath, convertFileUrlToPath } from "../../path/index.mjs";
import {
  openServiceAsync,
  closeServiceAsync,
  getServicePort,
} from "./index.mjs";

const { Promise, setTimeout } = globalThis;

{
  const service = await openServiceAsync(createServer(), 0);
  const socket = new Socket({ allowHalfOpen: false });
  await new Promise((resolve, reject) => {
    socket.on("connect", resolve);
    socket.on("error", reject);
    socket.connect(getServicePort(service));
  });
  // Wait for server to process connection
  await new Promise((resolve) => {
    setTimeout(resolve, 100);
  });
  await closeServiceAsync(service);
}

{
  const service = await openServiceAsync(createServer(), "");
  const socket = new Socket();
  await new Promise((resolve, reject) => {
    socket.on("connect", resolve);
    socket.on("error", reject);
    socket.connect(toIpcPath(convertFileUrlToPath(getServicePort(service))));
  });
  await new Promise((resolve, reject) => {
    socket.on("close", resolve);
    socket.on("error", reject);
    socket.end();
  });
  await closeServiceAsync(service);
}
