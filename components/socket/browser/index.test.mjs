/* eslint-env node */
import { default as WebSocket, WebSocketServer } from "ws";
import { assertEqual } from "../../__fixture__.mjs";
import { defineGlobal } from "../../global/index.mjs";

const { Promise } = globalThis;

const server = new WebSocketServer({ port: 0 });

await new Promise((resolve, reject) => {
  server.on("listening", resolve);
  server.on("error", reject);
});

server.on("connection", (ws, req) => {
  assertEqual(req.url, "/__appmap__");
  ws.on("message", (message) => {
    ws.send(message);
  });
});

defineGlobal("WebSocket", WebSocket);
defineGlobal("window", {
  location: `http://localhost:${server.address().port}/index.html`,
});

const {
  openSocket,
  addSocketListener,
  removeSocketListener,
  isSocketReady,
  sendSocket,
  closeSocket,
} = await import("./index.mjs");

const socket = openSocket({ "http-switch": "__appmap__" });

assertEqual(isSocketReady(socket), false);

sendSocket(socket, "before");

let onOpen;

await new Promise((resolve) => {
  onOpen = resolve;
  addSocketListener(socket, "open", resolve);
});

removeSocketListener(socket, "open", onOpen);

assertEqual(isSocketReady(socket), true);

sendSocket(socket, "message");

let onMessage;

assertEqual(
  await new Promise((resolve) => {
    onMessage = resolve;
    addSocketListener(socket, "message", resolve);
  }),
  "message",
);

removeSocketListener(socket, "message", onMessage);

closeSocket(socket);

assertEqual(isSocketReady(socket), false);

sendSocket(socket, "after");

await await new Promise((resolve) => {
  addSocketListener(socket, "close", resolve);
});

server.close();
