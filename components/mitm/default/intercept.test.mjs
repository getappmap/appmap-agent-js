import {
  createServer as createHttpServer,
  request as requestHttp,
} from "node:http";
import { Buffer } from "node:buffer";
import { default as WebSocket, WebSocketServer } from "ws";
import { assertEqual, assertMatch } from "../../__fixture__.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import { deflate } from "../../compress/index.mjs";
import { createBackend } from "../../backend/index.mjs";
import { bufferReadable } from "./stream.mjs";
import {
  interceptRequest,
  interceptUpgrade,
  interceptConnect,
} from "./intercept.mjs";

const {
  Error,
  String,
  Promise,
  JSON: { stringify: stringifyJSON },
} = globalThis;

const { from: toBuffer } = Buffer;

const wss = new WebSocketServer({ noServer: true });

const respond = (res, type, content) => {
  const body = toBuffer(content, "utf8");
  res.writeHead(200, {
    "content-type": `${type}; charset=utf-8`,
    "content-length": body.length,
  });
  res.end(body);
};

//////////////////
// Setup Server //
//////////////////

const server = createHttpServer();

server.on("request", (req, res) => {
  assertEqual(req.method, "GET");
  if (req.url === "/index.html") {
    respond(
      res,
      "text/html",
      `
        <!DOCTYPE html>
        <html>
          <head>
            <script>function f () {}</script>
          </head>
          <body>
          </body>
        </html>
      `,
    );
  } else if (req.url === "/script.js") {
    respond(res, "text/javascript", "function f () {}");
  } else if (req.url === "/plain.txt") {
    respond(res, "text/plain", "content");
  } else {
    throw new Error("unexpected request path");
  }
});

server.on("upgrade", (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    ws.on("message", (buffer) => {
      ws.send(buffer);
    });
  });
});

server.on("connect", (_req, socket, _head) => {
  socket.end("HTTP/1.1 200 Connection Established\r\n\r\n");
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

const configuration = extendConfiguration(
  createConfiguration("protocol://host/home"),
  {
    packages: [
      {
        regexp: "^",
        enabled: true,
      },
    ],
    hooks: {
      apply: "__HIDDEN__",
    },
    "http-switch": "__SWITCH__",
  },
  null,
);

const backend = createBackend(configuration);

const forge = createHttpServer();

forge.on("request", (inc_req, out_res) => {
  interceptRequest(configuration, backend, host, inc_req, out_res);
});

forge.on("upgrade", (req, socket, head) => {
  interceptUpgrade(configuration, backend, wss, host, req, socket, head);
});

forge.on("connect", (req, socket, head) => {
  interceptConnect(configuration, backend, host, req, socket, head);
});

forge.listen(0);

await new Promise((resolve, reject) => {
  forge.on("listening", resolve);
  forge.on("error", reject);
});

/////////////////////
// Request >> html //
/////////////////////

{
  const req = requestHttp({
    host: "localhost",
    port: forge.address().port,
    method: "GET",
    path: "/index.html",
    version: "1.1",
  });
  req.end();
  const res = await new Promise((resolve, reject) => {
    req.on("response", resolve);
    req.on("error", reject);
  });
  const scripts = [
    ...(
      await new Promise((resolve) => {
        bufferReadable(res, resolve);
      })
    )
      .toString("utf8")
      .matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gu),
  ].map((match) => match[1]);
  assertEqual(scripts.length, 2);
  assertMatch(scripts[0], /__APPMAP_CONFIGURATION__/u);
  assertMatch(scripts[1], /__HIDDEN__/u);
}

///////////////////
// Request >> js //
///////////////////

{
  const req = requestHttp({
    host: "localhost",
    port: forge.address().port,
    method: "GET",
    path: "/script.js",
    version: "1.1",
  });
  req.end();
  const res = await new Promise((resolve, reject) => {
    req.on("response", resolve);
    req.on("error", reject);
  });
  assertMatch(
    (
      await new Promise((resolve) => {
        bufferReadable(res, resolve);
      })
    ).toString("utf8"),
    /^\s*function\s*f\s*\(\s*\)[\s\S]*__HIDDEN__/u,
  );
}

//////////////////////
// Request >> plain //
//////////////////////

{
  const req = requestHttp({
    host: "localhost",
    port: forge.address().port,
    method: "GET",
    path: "/plain.txt",
    version: "1.1",
  });
  req.end();
  const res = await new Promise((resolve, reject) => {
    req.on("response", resolve);
    req.on("error", reject);
  });
  assertEqual(
    (
      await new Promise((resolve) => {
        bufferReadable(res, resolve);
      })
    ).toString("utf8"),
    "content",
  );
}

////////////////////////
// Upgrade >> forward //
////////////////////////

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

//////////////////////////
// Upgrade >> Intercept //
//////////////////////////

{
  const ws = new WebSocket(
    `ws://localhost:${String(forge.address().port)}/__SWITCH__`,
  );
  await new Promise((resolve, reject) => {
    ws.on("open", resolve);
    ws.on("error", reject);
  });
  ws.send(
    toBuffer(
      stringifyJSON(
        deflate([
          {
            type: "error",
            session: "session",
            error: { type: "number", print: "123" },
          },
        ]),
      ),
    ),
  );
  ws.close();
  await new Promise((resolve, reject) => {
    ws.on("close", resolve);
    ws.on("error", reject);
  });
}

/////////////
// Connect //
/////////////

{
  const req = requestHttp({
    host: "localhost",
    port: forge.address().port,
    method: "CONNECT",
    path: "/",
    version: "1.1",
  });
  req.end();
  assertEqual(
    (
      await new Promise((resolve, reject) => {
        req.on("connect", resolve);
        req.on("error", reject);
      })
    ).statusCode,
    200,
  );
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
