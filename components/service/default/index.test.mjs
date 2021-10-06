import { strict as Assert } from "assert";
import { createServer, Socket } from "net";

import { buildTestDependenciesAsync } from "../../build.mjs";
import Service from "./index.mjs";

const {
  // equal:assertEqual,
} = Assert;

const { openServiceAsync, closeServiceAsync, getServicePort } = Service(
  await buildTestDependenciesAsync(import.meta.url),
);

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
    socket.connect(getServicePort(service));
  });
  await new Promise((resolve, reject) => {
    socket.on("close", resolve);
    socket.on("error", reject);
    socket.end();
  });
  await closeServiceAsync(service);
}
