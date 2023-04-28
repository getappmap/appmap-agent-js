/* eslint-env node */
import { default as WebSocket, WebSocketServer } from "ws";
import { assertEqual } from "../../__fixture__.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import { defineGlobal } from "../../global/index.mjs";

const { Promise } = globalThis;

const server = new WebSocketServer({ port: 0 });

await new Promise((resolve, reject) => {
  server.on("listening", resolve);
  server.on("error", reject);
});

defineGlobal("WebSocket", WebSocket);
defineGlobal("window", {
  location: `http://localhost:${server.address().port}/index.html`,
});

const {
  createSocket,
  isSocketReady,
  openSocketAsync,
  sendSocket,
  closeSocketAsync,
} = await import("./index.mjs");

const socket = createSocket(
  extendConfiguration(
    createConfiguration("protocol://host/home"),
    {
      "http-switch": "__appmap__",
    },
    null,
  ),
);

assertEqual(isSocketReady(socket), false);

sendSocket(socket, "before");

const [ws] = await Promise.all([
  new Promise((resolve, reject) => {
    server.on("error", reject);
    server.on("connection", (ws, req) => {
      assertEqual(req.url, "/__appmap__");
      resolve(ws);
    });
  }),
  openSocketAsync(socket),
]);

assertEqual(isSocketReady(socket), true);

sendSocket(socket, "message");

assertEqual(
  (
    await new Promise((resolve, reject) => {
      ws.on("error", reject);
      ws.on("message", resolve);
    })
  ).toString("utf8"),
  "message",
);

await closeSocketAsync(socket);

assertEqual(isSocketReady(socket), false);

sendSocket(socket, "after");

server.close();
