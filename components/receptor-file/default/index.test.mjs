import { readFileSync as readFile, writeFileSync as writeFile } from "fs";
import { getFreshTemporaryURL } from "../../__fixture__.mjs";
import { Socket } from "net";
import NetSocketMessaging from "net-socket-messaging";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs?env=test";
import {
  openReceptorAsync,
  adaptReceptorConfiguration,
  minifyReceptorConfiguration,
  closeReceptorAsync,
} from "./index.mjs?env=test";

const {
  Promise,
  JSON: { stringify: stringifyJSON },
  URL,
} = globalThis;

const { createMessage } = NetSocketMessaging;

const url = getFreshTemporaryURL();

const testAsync = async (port, configuration, messages) => {
  const socket = new Socket();
  socket.connect(port);
  await new Promise((resolve) => {
    socket.on("connect", resolve);
  });
  socket.write(createMessage("session"));
  socket.write(createMessage(stringifyJSON(configuration)));
  for (const message of messages) {
    socket.write(createMessage(stringifyJSON(message)));
  }
  await new Promise((resolve) => {
    socket.on("close", resolve);
    socket.end();
  });
};

const receptor_configuration = extendConfiguration(
  createConfiguration("file:///home"),
  {
    recorder: "process",
    appmap_dir: "directory",
  },
  url,
);

const receptor = await openReceptorAsync(
  minifyReceptorConfiguration(receptor_configuration),
);

const port = adaptReceptorConfiguration(receptor, receptor_configuration)[
  "trace-port"
];

await testAsync(
  port,
  extendConfiguration(
    createConfiguration("file:///home"),
    {
      recorder: "remote",
    },
    null,
  ),
  [],
);

{
  const url = getFreshTemporaryURL();
  writeFile(new URL(url), "content", "utf8");
  await testAsync(
    port,
    extendConfiguration(
      createConfiguration("file:///home"),
      {
        recorder: "process",
      },
      null,
    ),
    [
      {
        type: "start",
        track: "track",
        configuration: {},
        url: null,
      },
      {
        type: "source",
        url,
        content: null,
        shallow: false,
        inline: false,
        exclude: [],
      },
      {
        type: "stop",
        track: "track",
        status: 0,
      },
    ],
  );
}

readFile(new URL(`${url}/directory/process/anonymous.appmap.json`));

await testAsync(
  port,
  extendConfiguration(
    createConfiguration("file:///home"),
    {
      recorder: "process",
    },
    null,
  ),
  [
    {
      type: "start",
      track: "track",
      configuration: {},
      url: null,
    },
  ],
);

readFile(new URL(`${url}/directory/process/anonymous-1.appmap.json`));

await testAsync(
  port,
  extendConfiguration(
    createConfiguration("file:///home"),
    {
      recorder: "process",
      "map-name": "map / name",
    },
    null,
  ),
  [
    {
      type: "start",
      track: "track",
      configuration: {},
      url: null,
    },
  ],
);

readFile(new URL(`${url}/directory/process/map-name.appmap.json`));

await closeReceptorAsync(receptor);
