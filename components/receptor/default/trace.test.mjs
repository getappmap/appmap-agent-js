import { assertDeepEqual } from "../../__fixture__.mjs";
import { writeFile as writeFileAsync } from "node:fs/promises";
import { Socket } from "node:net";
import NetSocketMessaging from "net-socket-messaging";
import { getUuid } from "../../uuid/random/index.mjs";
import { getTmpUrl } from "../../path/index.mjs";
import { toAbsoluteUrl } from "../../url/index.mjs";
import {
  createBackend,
  sendBackend,
  compileBackendTrace,
} from "../../backend/index.mjs";
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

sendBackend(backend, "session", { type: "open" });

socket.write(createMessage("session"));

const message1 = {
  type: "start",
  track: "record",
  configuration: {},
  url: null,
};

socket.write(createMessage(stringifyJSON(message1)));

const missing_source_url = toAbsoluteUrl(
  `${uuid}-missing-source.js`,
  getTmpUrl(),
);

const message2 = {
  type: "source",
  url: missing_source_url,
  content: null,
  shallow: false,
  inline: false,
  exclude: [],
};

socket.write(createMessage(stringifyJSON(message2)));

const source_url = toAbsoluteUrl(`${uuid}-source.js`, getTmpUrl());

const message3 = {
  type: "source",
  url: source_url,
  content: null,
  shallow: false,
  inline: false,
  exclude: [],
};

await writeFileAsync(new URL(source_url), "123;", "utf8");

socket.write(createMessage(stringifyJSON(message3)));

const message4 = {
  type: "stop",
  track: "record",
  termination: { type: "manual" },
};

socket.write(createMessage(stringifyJSON(message4)));

socket.end();

await new Promise((resolve) => {
  socket.on("close", resolve);
});

assertDeepEqual(compileBackendTrace(backend, "session", "record"), {
  url: toAbsoluteUrl(
    `${uuid}/dirname/process/basename.appmap.json`,
    getTmpUrl(),
  ),
  content: [message2, { ...message3, content: "123;" }, message1, message4],
});

sendBackend(backend, "session", { type: "close" });

server.close();

await new Promise((resolve) => {
  server.on("close", resolve);
});
