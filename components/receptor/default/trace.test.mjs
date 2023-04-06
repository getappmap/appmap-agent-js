import { writeFile as writeFileAsync } from "node:fs/promises";
import { Socket } from "node:net";
import NetSocketMessaging from "net-socket-messaging";
import { assertDeepEqual } from "../../__fixture__.mjs";
import { getUuid } from "../../uuid/random/index.mjs";
import { getTmpUrl } from "../../path/index.mjs";
import { toAbsoluteUrl } from "../../url/index.mjs";
import { createBackend, compileBackendTrack } from "../../backend/index.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import { createTraceServer } from "./trace.mjs";

const {
  Promise,
  JSON: { stringify: stringifyJSON },
  URL,
} = globalThis;

const { createMessage } = NetSocketMessaging;

const uuid = getUuid();

const configuration = extendConfiguration(
  createConfiguration("protocol://host/home/"),
  {
    recorder: "process",
    appmap_dir: "dirname",
    appmap_file: "basename",
  },
  toAbsoluteUrl(`${uuid}/`, getTmpUrl()),
);

const backend = createBackend(configuration);

const server = createTraceServer(backend);

server.listen(0);

await new Promise((resolve) => {
  server.on("listening", resolve);
});

const { port } = server.address();

const socket = new Socket();

socket.connect(port);

await new Promise((resolve) => {
  socket.on("connect", resolve);
});

const start_1_message = {
  type: "start",
  track: "record1",
  configuration,
};

socket.write(createMessage(stringifyJSON(start_1_message)));

const start_2_message = {
  type: "start",
  track: "record2",
  configuration,
};

socket.write(createMessage(stringifyJSON(start_2_message)));

const missing_source_url = toAbsoluteUrl(
  `${uuid}-missing-source.js`,
  getTmpUrl(),
);

const missing_source_message = {
  type: "source",
  url: missing_source_url,
  content: null,
};

socket.write(createMessage(stringifyJSON(missing_source_message)));

const source_url = toAbsoluteUrl(`${uuid}-source.js`, getTmpUrl());

const source_message = {
  type: "source",
  url: source_url,
  content: null,
};

await writeFileAsync(new URL(source_url), "123;", "utf8");

socket.write(createMessage(stringifyJSON(source_message)));

const stop_1_message = {
  type: "stop",
  track: "record1",
  termination: { type: "manual" },
};

socket.write(createMessage(stringifyJSON(stop_1_message)));

const stop_all_message = {
  type: "stop",
  track: null,
  termination: { type: "unknown" },
};

socket.write(createMessage(stringifyJSON(stop_all_message)));

const start_3_message = {
  type: "start",
  track: "record3",
  configuration,
};

socket.write(createMessage(stringifyJSON(start_3_message)));

socket.end();

await new Promise((resolve) => {
  socket.on("close", resolve);
});

server.close();

await new Promise((resolve) => {
  server.on("close", resolve);
});

const test = (track, termination) => {
  assertDeepEqual(compileBackendTrack(backend, track, false), {
    url: toAbsoluteUrl(
      `${uuid}/dirname/process/basename.appmap.json`,
      getTmpUrl(),
    ),
    content: {
      configuration,
      messages: [{ ...source_message, content: "123;" }],
      termination,
    },
  });
};

test("record1", { type: "manual" });
test("record2", { type: "unknown" });
test("record3", { type: "disconnect" });
