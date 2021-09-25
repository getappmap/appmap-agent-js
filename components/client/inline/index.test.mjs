/* eslint-env node */
import { tmpdir } from "os";
import { strict as Assert } from "assert";
import { request as createRequest } from "http";
import { mkdir, readFile } from "fs/promises";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Client from "./index.mjs";

const { deepEqual: assertDeepEqual } = Assert;

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration");
const {
  openClient,
  promiseClientTermination,
  closeClient,
  traceClient,
  trackClientAsync,
  listenClientAsync,
} = Client(dependencies);
const directory = `${tmpdir()}/${Math.random().toString(36).substring(2)}`;
await mkdir(directory);
const configuration = extendConfiguration(
  createConfiguration(directory),
  {
    name: "name",
    "local-track-port": "socket",
  },
  directory,
);
const client = openClient(configuration);
await listenClientAsync(client);
traceClient(client, ["initialize", configuration]);
traceClient(client, [
  "start",
  "track1",
  {
    path: directory,
    data: { output: { directory: ".", basename: "basename" } },
  },
]);
assertDeepEqual(
  await trackClientAsync(client, "POST", "/track2", {
    path: null,
    data: { output: null },
  }),
  {
    code: 200,
    message: null,
    body: null,
  },
);
traceClient(client, ["terminate", { errors: [], status: 0 }]);

assertDeepEqual(
  JSON.parse(await readFile(`${directory}/basename.appmap.json`, "utf8")),
  await new Promise((resolve, reject) => {
    const request = createRequest({
      method: "DELETE",
      path: "/track2",
      socketPath: `${directory}/socket`,
    });
    request.end();
    request.on("error", reject);
    request.on("response", (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`http status code: ${String(response.statusCode)}`));
      }
      response.on("error", reject);
      let buffers = [];
      response.on("data", (buffer) => {
        buffers.push(buffer);
      });
      response.on("end", () => {
        resolve(JSON.parse(Buffer.concat(buffers).toString("utf8")));
      });
    });
  }),
);

closeClient(client);
await promiseClientTermination(client);
