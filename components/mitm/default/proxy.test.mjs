import {
  request as requestHttp,
  createServer as createHttpServer,
} from "node:http";
import { Buffer } from "node:buffer";
import { assertEqual } from "../../__fixture__.mjs";
import { createPool } from "../../pool/index.mjs";
import { requestProxy, upgradeProxy, connectProxy } from "./proxy.mjs";

const { Error, Map, Promise, String } = globalThis;

const { from: toBuffer } = Buffer;

///////////
// Setup //
///////////

const pool = createPool();

const proxy = createHttpServer();

const servers = new Map();

const handlers = {
  request: (host, _req, res) => {
    res.writeHead(200, {
      "host-name": host.name,
      "host-port": String(host.port),
    });
    res.end();
  },
  connect: (host, _req, socket, _head) => {
    socket.write(
      toBuffer(
        [
          "HTTP/1.1 200 Connection Established",
          `Host-Name: ${host.name}`,
          `Host-Port: ${String(host.port)}`,
          "",
          "",
        ].join("\r\n"),
        "utf8",
      ),
    );
  },
  upgrade: (host, _req, socket, _head) => {
    socket.end(
      toBuffer(
        [
          "HTTP/1.1 101 Switching Protocols",
          "Connection: Upgrade",
          "Upgrade: HTTP/2",
          `Host-Name: ${host.name}`,
          `Host-Port: ${String(host.port)}`,
          "",
          "",
        ].join("\r\n"),
        "utf8",
      ),
    );
  },
};

proxy.on("request", (req, res) => {
  requestProxy(handlers.request, req, res);
});

proxy.on("upgrade", (req, socket, head) => {
  upgradeProxy(handlers.upgrade, req, socket, head);
});

proxy.on("connect", (req, socket, head) => {
  connectProxy(handlers, servers, pool, req, socket, head);
});

proxy.listen(0);

await new Promise((resolve, reject) => {
  proxy.on("listening", resolve);
  proxy.on("error", reject);
});

///////////////////////////////
// Direct >> Regular Request //
///////////////////////////////

{
  const req = requestHttp({
    host: "localhost",
    port: proxy.address().port,
    method: "GET",
    path: "/",
    version: "1.1",
    headers: {
      host: "example.org:1234",
    },
  });
  req.end();
  const res = await new Promise((resolve, reject) => {
    req.on("response", resolve);
    req.on("error", reject);
  });
  assertEqual(res.statusCode, 200);
  assertEqual(res.headers["host-name"], "example.org");
  assertEqual(res.headers["host-port"], "1234");
  await new Promise((resolve, reject) => {
    res.on("end", resolve);
    res.on("data", () => {
      reject(new Error("unexpected data"));
    });
    res.on("error", reject);
  });
}

///////////////////////////////
// Direct >> Upgrade Request //
///////////////////////////////

{
  const req = requestHttp({
    host: "localhost",
    port: proxy.address().port,
    method: "GET",
    path: "/",
    version: "1.1",
    headers: {
      host: "example.org:1234",
      connection: "upgrade",
      upgrade: "HTTP/2",
    },
  });
  req.end();
  const res = await new Promise((resolve, reject) => {
    req.on("response", (_res) => {
      reject(new Error("regular response to upgrade request"));
    });
    req.on("upgrade", resolve);
    req.on("error", reject);
  });
  assertEqual(res.statusCode, 101);
  assertEqual(res.headers["host-name"], "example.org");
  assertEqual(res.headers["host-port"], "1234");
  await new Promise((resolve, reject) => {
    res.on("end", resolve);
    res.on("data", () => {
      reject(new Error("unexpected data"));
    });
    res.on("error", reject);
  });
}

////////////
// Tunnel //
////////////

const connectAsync = async (host1, host2) => {
  const req = requestHttp({
    host: host1.name,
    port: host1.port,
    method: "CONNECT",
    path: `${host2.name}:${String(host2.port)}`,
    version: "1.1",
  });
  req.end();
  const [res, socket, _head] = await new Promise((resolve, reject) => {
    req.on("response", (_res) => {
      reject(new Error("regular response to connect request"));
    });
    req.on("connect", (res, socket, head) => {
      resolve([res, socket, head]);
    });
    req.on("error", reject);
  });
  assertEqual(res.statusCode, 200);
  assertEqual(res.statusMessage, "Connection Established");
  await new Promise((resolve, reject) => {
    res.on("end", resolve);
    res.on("data", () => {
      reject(new Error("unexpected data"));
    });
    res.on("error", reject);
  });
  return socket;
};

///////////////////////////////
// Tunnel >> Regular Request //
///////////////////////////////

{
  const socket = await connectAsync(
    { name: "localhost", port: proxy.address().port },
    { name: "example.org", port: 1234 },
  );
  const req = requestHttp({
    createConnection: (_options, _callback) => socket,
    method: "GET",
    path: "/",
    version: "1.1",
  });
  req.end();
  const res = await new Promise((resolve, reject) => {
    req.on("response", resolve);
    req.on("error", reject);
  });
  assertEqual(res.statusCode, 200);
  assertEqual(res.headers["host-name"], "example.org");
  assertEqual(res.headers["host-port"], "1234");
  await new Promise((resolve, reject) => {
    res.on("end", resolve);
    res.on("data", () => {
      reject(new Error("unexpected data"));
    });
    res.on("error", reject);
  });
  socket.end();
  await new Promise((resolve, reject) => {
    socket.on("error", reject);
    socket.on("close", resolve);
  });
}

///////////////////////////////
// Tunnel >> Upgrade Request //
///////////////////////////////

{
  const socket = await connectAsync(
    { name: "localhost", port: proxy.address().port },
    { name: "example.org", port: 1234 },
  );
  const req = requestHttp({
    createConnection: (_options, _callback) => socket,
    method: "GET",
    path: "/",
    version: "1.1",
    headers: {
      connection: "upgrade",
      upgrade: "HTTP/2",
    },
  });
  req.end();
  const res = await new Promise((resolve, reject) => {
    req.on("response", (_res) => {
      reject(new Error("regular response to upgrade request"));
    });
    req.on("upgrade", resolve);
    req.on("error", reject);
  });
  assertEqual(res.statusCode, 101);
  assertEqual(res.headers["host-name"], "example.org");
  assertEqual(res.headers["host-port"], "1234");
  await new Promise((resolve, reject) => {
    res.on("end", resolve);
    res.on("data", () => {
      reject(new Error("unexpected data"));
    });
    res.on("error", reject);
  });
  socket.end();
  await new Promise((resolve, reject) => {
    socket.on("error", reject);
    socket.on("close", resolve);
  });
}

//////////////
// Teardown //
//////////////

proxy.close();

await new Promise((resolve, reject) => {
  proxy.on("error", reject);
  proxy.on("close", resolve);
});

for (const server of servers.values()) {
  server.close();
  await new Promise((resolve, reject) => {
    server.on("error", reject);
    server.on("close", resolve);
  });
}
