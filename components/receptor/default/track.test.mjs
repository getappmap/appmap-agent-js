import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import { createBackend, sendBackend } from "../../backend/index.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import { requestAsync } from "../../http/index.mjs";
import { success, failure, createTrackServer } from "./track.mjs";

const { Promise } = globalThis;

const configuration = extendConfiguration(
  createConfiguration("protocol://host/home/"),
  {},
  "protocol://host/base/",
);

const backend = createBackend(configuration);

const server = createTrackServer(backend);

server.listen(0);

await new Promise((resolve) => {
  server.on("listening", resolve);
});

const { port } = server.address();

assertDeepEqual(
  await requestAsync("localhost", port, "GET", "/invalid-path", null),
  failure,
);

const req = (method) => ["localhost", port, method, "/_appmap/record", null];

assertDeepEqual(await requestAsync(...req("GET")), failure);

assertDeepEqual(await requestAsync(...req("POST")), failure);

assertDeepEqual(await requestAsync(...req("DELETE")), failure);

assertDeepEqual(await requestAsync(...req("HEAD")), failure);

assertEqual(sendBackend(backend, "_appmap", { type: "open" }), true);

assertDeepEqual(await requestAsync(...req("GET")), {
  ...success,
  body: { enabled: false },
});

assertDeepEqual(await requestAsync(...req("POST")), success);

assertDeepEqual(await requestAsync(...req("GET")), {
  ...success,
  body: { enabled: true },
});

assertDeepEqual(await requestAsync(...req("DELETE")), {
  ...success,
  body: [
    { type: "start", track: "record", configuration: {}, url: null },
    {
      type: "stop",
      track: "record",
      termination: { type: "manual" },
    },
  ],
});

server.close();

await new Promise((resolve) => {
  server.on("close", resolve);
});
