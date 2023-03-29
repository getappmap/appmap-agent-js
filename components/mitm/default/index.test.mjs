import {
  createServer as createHttpServer,
  request as requestHttp,
} from "node:http";
import { assertEqual } from "../../__fixture__.mjs";
import { createBackend } from "../../backend/index.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import { openMitmAsync, getMitmPort, closeMitmAsync } from "./index.mjs";

const { Error, Promise } = globalThis;

///////////
// Setup //
///////////

const server = createHttpServer();

server.listen(0);

await new Promise((resolve, reject) => {
  server.on("error", reject);
  server.on("listening", resolve);
});

server.on("request", (_req, res) => {
  res.writeHead(200);
  res.end();
});

const configuration = extendConfiguration(
  createConfiguration("protocol://host/path"),
  {
    "proxy-port": 0,
  },
  null,
);

const mitm = await openMitmAsync(configuration, createBackend(configuration));

////////////
// Tunnel //
////////////

const con_req = requestHttp({
  host: "localhost",
  port: getMitmPort(mitm),
  method: "CONNECT",
  path: `localhost:${server.address().port}`,
  version: "1.1",
});

con_req.end();

const [con_res, socket, _head] = await new Promise((resolve, reject) => {
  con_req.on("response", (_con_res) => {
    reject(new Error("regular response to connect request"));
  });
  con_req.on("connect", (res, socket, head) => {
    resolve([res, socket, head]);
  });
  con_req.on("error", reject);
});

assertEqual(con_res.statusCode, 200);

assertEqual(con_res.statusMessage, "Connection Established");

await new Promise((resolve, reject) => {
  con_res.on("end", resolve);
  con_res.on("data", () => {
    reject(new Error("unexpected data"));
  });
  con_res.on("error", reject);
});

/////////////
// Request //
/////////////

const get_req = requestHttp({
  createConnection: (_options, _callback) => socket,
  method: "GET",
  path: "/",
  version: "1.1",
});

get_req.end();

const get_res = await new Promise((resolve, reject) => {
  get_req.on("response", resolve);
  get_req.on("error", reject);
});

assertEqual(get_res.statusCode, 200);

await new Promise((resolve, reject) => {
  get_res.on("end", resolve);
  get_res.on("data", () => {
    reject(new Error("unexpected data"));
  });
  get_res.on("error", reject);
});

socket.end();

await new Promise((resolve, reject) => {
  socket.on("error", reject);
  socket.on("close", resolve);
});

//////////////
// Teardown //
//////////////

await closeMitmAsync(mitm);

server.close();

await new Promise((resolve, reject) => {
  server.on("error", reject);
  server.on("close", resolve);
});
