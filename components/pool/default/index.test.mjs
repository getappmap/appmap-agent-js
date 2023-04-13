import { createServer, Socket } from "node:net";
import { createPool, addPool, closePool } from "./index.mjs";

const { Promise } = globalThis;

const testAsync = async (allow_half_open) => {
  const server = createServer({
    allowHalfOpen: allow_half_open,
  });
  server.listen(0);
  await new Promise((resolve, reject) => {
    server.on("error", reject);
    server.on("listening", resolve);
  });
  const pool = createPool();
  server.on("connection", (socket) => {
    addPool(pool, socket);
  });
  const socket = new Socket({
    allowHalfOpen: allow_half_open,
  });
  socket.connect(server.address().port);
  await Promise.all([
    new Promise((resolve, reject) => {
      socket.on("error", reject);
      socket.on("connect", resolve);
    }),
    new Promise((resolve, reject) => {
      server.on("error", reject);
      server.on("connection", resolve);
    }),
  ]);
  server.close();
  closePool(pool, 1000);
  await new Promise((resolve, reject) => {
    server.on("error", reject);
    server.on("close", resolve);
  });
  socket.destroy();
};

await testAsync(true);

await testAsync(false);
