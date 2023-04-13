// This file test the frontend + backend without appmap.
// It is only used manually to diagnose issues.

import {
  createServer as createHttpServer,
  request as requestHttp,
} from "node:http";
import { spawn } from "node:child_process";
import { openBackendAsync, closeBackendAsync } from "./backend.mjs";

const { URL, String, parseInt, Promise } = globalThis;

const { url: __url } = import.meta;

const backend_port = 8080;
const proxy_port = 8888;

const backend = await openBackendAsync(backend_port);

const proxy = createHttpServer();

proxy.listen(proxy_port);

await new Promise((resolve, reject) => {
  proxy.on("error", reject);
  proxy.on("listening", resolve);
});

proxy.on("request", (inc_req, out_res) => {
  const out_req = requestHttp({
    host: inc_req.headers.host.split(":")[0],
    port: parseInt(inc_req.headers.host.split(":")[1]),
    method: inc_req.method,
    path: inc_req.url,
    headers: inc_req.headers,
  });
  inc_req.pipe(out_req);
  out_req.on("response", (inc_res) => {
    out_res.writeHead(
      inc_res.statusCode,
      inc_res.statusMessage,
      inc_res.headers,
    );
    inc_res.pipe(out_res);
  });
});

const frontend = spawn(
  "node",
  ["frontend.mjs", String(backend_port), String(proxy_port)],
  { stdio: "inherit", cwd: new URL(".", __url) },
);

await new Promise((resolve, reject) => {
  frontend.on("error", reject);
  frontend.on("close", resolve);
});

proxy.close();

await new Promise((resolve, reject) => {
  proxy.on("error", reject);
  proxy.on("close", resolve);
});

await closeBackendAsync(backend);
