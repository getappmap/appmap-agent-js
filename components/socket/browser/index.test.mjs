/* eslint-env node */
import { default as WebSocket, WebSocketServer } from "ws";
import { assertEqual } from "../../__fixture__.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import { defineGlobal } from "../../global/index.mjs";

const { Promise } = globalThis;

defineGlobal("WebSocket", WebSocket);

const { openSocket, sendSocket, closeSocket } = await import("./index.mjs");

const server = new WebSocketServer({ port: 0 });

await new Promise((resolve, reject) => {
  server.on("listening", resolve);
  server.on("error", reject);
});

const socket = openSocket(
  "localhost",
  server.address().port,
  extendConfiguration(
    createConfiguration("protocol://host/home"),
    {
      "http-switch": "__appmap__",
    },
    null,
  ),
);

sendSocket(socket, "connecting");

const ws = await new Promise((resolve, reject) => {
  server.on("error", reject);
  server.on("connection", (ws, req) => {
    assertEqual(req.url, "/__appmap__");
    resolve(ws);
  });
});

assertEqual(
  (
    await new Promise((resolve, reject) => {
      ws.on("error", reject);
      ws.on("message", resolve);
    })
  ).toString("utf8"),
  "connecting",
);

sendSocket(socket, "open");

assertEqual(
  (
    await new Promise((resolve, reject) => {
      ws.on("error", reject);
      ws.on("message", resolve);
    })
  ).toString("utf8"),
  "open",
);

closeSocket(socket);

sendSocket(socket, "closing");

server.close();
