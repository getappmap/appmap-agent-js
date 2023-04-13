import {
  createServer as createHttpServer,
  request as requestHttp,
} from "node:http";
import { Buffer } from "node:buffer";
import { default as WebSocket, WebSocketServer } from "ws";
import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import { bufferReadable } from "./stream.mjs";
import {
  forwardRequest,
  forwardResponse,
  forwardUpgrade,
  forwardConnect,
} from "./forward.mjs";

const {
  String,
  Promise,
  JSON: { stringify: stringifyJSON, parse: parseJSON },
} = globalThis;

const { from: toBuffer } = Buffer;

const wss = new WebSocketServer({ noServer: true });

//////////////////
// Setup Server //
//////////////////

const server = createHttpServer();

server.on("request", (req, res) => {
  bufferReadable(req, (buffer) => {
    const body = toBuffer(
      stringifyJSON({
        method: req.method,
        path: req.url,
        version: req.httpVersion,
        body: buffer.toString("utf8"),
      }),
      "utf8",
    );
    res.writeHead(200, {
      "content-type": "application/json",
      "content-length": body.length,
    });
    res.end(body);
  });
});

server.on("upgrade", (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    ws.on("message", (buffer) => {
      ws.send(buffer);
    });
  });
});

server.listen(0);

await new Promise((resolve, reject) => {
  server.on("listening", resolve);
  server.on("error", reject);
});

const host = { name: "localhost", port: server.address().port };

/////////////////
// Setup Forge //
/////////////////

const forge = createHttpServer();

forge.on("request", (inc_req, out_res) => {
  forwardRequest(host, inc_req, (error, inc_res) => {
    assertEqual(error, null);
    forwardResponse(inc_res, out_res);
  });
});

forge.on("upgrade", (req, socket, head) => {
  forwardUpgrade(host, req, socket, head);
});

forge.on("connect", (req, socket, head) => {
  forwardConnect(host, req, socket, head);
});

forge.listen(0);

await new Promise((resolve, reject) => {
  forge.on("listening", resolve);
  forge.on("error", reject);
});

/////////////
// Request //
/////////////

{
  const req = requestHttp({
    host: "localhost",
    port: forge.address().port,
    method: "POST",
    path: "/path",
    version: "1.1",
  });
  req.end("body");
  const res = await new Promise((resolve, reject) => {
    req.on("response", resolve);
    req.on("error", reject);
  });
  assertDeepEqual(
    parseJSON(
      (
        await new Promise((resolve) => {
          bufferReadable(res, resolve);
        })
      ).toString("utf8"),
    ),
    {
      method: "POST",
      path: "/path",
      version: "1.1",
      body: "body",
    },
  );
}

/////////////
// Upgrade //
/////////////

{
  const ws = new WebSocket(`ws://localhost:${String(forge.address().port)}`);
  await new Promise((resolve, reject) => {
    ws.on("open", resolve);
    ws.on("error", reject);
  });
  ws.send(toBuffer("message", "utf8"));
  assertEqual(
    (
      await new Promise((resolve, reject) => {
        ws.on("message", resolve);
        ws.on("error", reject);
      })
    ).toString("utf8"),
    "message",
  );
  ws.close();
  await new Promise((resolve, reject) => {
    ws.on("close", resolve);
    ws.on("error", reject);
  });
}

//////////////
// Teardown //
//////////////

forge.close();

await new Promise((resolve, reject) => {
  forge.on("error", reject);
  forge.on("close", resolve);
});

server.close();

await new Promise((resolve, reject) => {
  server.on("error", reject);
  server.on("close", resolve);
});
