import { setTimeout, clearTimeout } from "node:timers";

const { Set } = globalThis;

export const createPool = () => ({
  timer: null,
  sockets: new Set(),
});

export const addPool = (pool, socket) => {
  pool.sockets.add(socket);
  socket.on("close", () => {
    pool.sockets.delete(socket);
    if (pool.sockets.size === 0 && pool.timer !== null) {
      clearTimeout(pool.timer);
      pool.timer = null;
    }
  });
};

export const closePool = (pool, delay) => {
  if (delay === 0) {
    for (const socket of pool.sockets) {
      socket.destroy();
    }
    clearTimeout(pool.timer);
    pool.timer = null;
  } else {
    for (const socket of pool.sockets) {
      socket.end();
    }
    pool.timer = setTimeout(closePool, delay, pool, 0);
  }
};
