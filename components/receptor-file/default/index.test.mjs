import { readFile as readFileAsync } from "fs/promises";
import { getFreshTemporaryURL } from "../../__fixture__.mjs";
import { Socket } from "net";
import NetSocketMessaging from "net-socket-messaging";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Receptor from "./index.mjs";

const { createMessage } = NetSocketMessaging;

const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration");

const {
  openReceptorAsync,
  adaptReceptorConfiguration,
  minifyReceptorConfiguration,
  closeReceptorAsync,
} = Receptor(await buildTestDependenciesAsync(import.meta.url));

const url = getFreshTemporaryURL();
const configuration = extendConfiguration(
  createConfiguration("file:///home"),
  {
    recorder: "process",
    appmap_dir: "directory",
  },
  url,
);
const receptor = await openReceptorAsync(
  minifyReceptorConfiguration(configuration),
);

{
  const socket = new Socket();
  socket.connect(
    adaptReceptorConfiguration(receptor, configuration)["trace-port"],
  );
  await new Promise((resolve) => {
    socket.on("connect", resolve);
  });
  socket.write(createMessage("session"));
  socket.write(
    createMessage(
      JSON.stringify(
        extendConfiguration(
          createConfiguration("file:///home"),
          {
            recorder: "remote",
          },
          null,
        ),
      ),
    ),
  );
  await new Promise((resolve) => {
    socket.on("close", resolve);
  });
}

{
  const socket = new Socket();
  socket.connect(
    adaptReceptorConfiguration(receptor, configuration)["trace-port"],
  );
  await new Promise((resolve) => {
    socket.on("connect", resolve);
  });
  socket.write(createMessage("session"));
  socket.write(
    createMessage(
      JSON.stringify(
        extendConfiguration(
          createConfiguration("file:///home"),
          {
            recorder: "process",
          },
          null,
        ),
      ),
    ),
  );
  socket.write(
    createMessage(
      JSON.stringify(["start", "record1", { path: null, data: {} }]),
    ),
  );
  socket.write(
    createMessage(
      JSON.stringify(["stop", "record1", { status: 0, errors: [] }]),
    ),
  );
  socket.write(
    createMessage(
      JSON.stringify(["start", "record2", { path: null, data: {} }]),
    ),
  );
  socket.write(
    createMessage(
      JSON.stringify([
        "start",
        "record3",
        { path: null, data: { "map-name": " map / name " } },
      ]),
    ),
  );
  await new Promise((resolve) => {
    socket.on("close", resolve);
    socket.end();
  });
  await closeReceptorAsync(receptor);
  await readFileAsync(
    new URL(`${url}/directory/process/anonymous.appmap.json`),
  );
  await readFileAsync(
    new URL(`${url}/directory/process/anonymous-1.appmap.json`),
  );
  await readFileAsync(new URL(`${url}/directory/process/map-name.appmap.json`));
}
