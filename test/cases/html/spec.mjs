import { argv } from "node:process";
import { spawn } from "node:child_process";
import { openBackendAsync, closeBackendAsync } from "./backend.mjs";

const { URL, setTimeout, Promise, String } = globalThis;

const { url: __url } = import.meta;

const bin_path = argv[2];
const backend_port = 8080;
const proxy_port = 8888;

const backend = await openBackendAsync(backend_port);

const appmap = spawn("node", [bin_path], {
  stdio: "inherit",
  cwd: new URL(".", __url),
});

await new Promise((resolve) => {
  setTimeout(resolve, 3000);
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

appmap.kill("SIGINT");

await new Promise((resolve, reject) => {
  appmap.on("error", reject);
  appmap.on("close", resolve);
});

await closeBackendAsync(backend);
