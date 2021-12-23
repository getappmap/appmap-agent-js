import { readFile as readFileAsync } from "fs/promises";
import { getFreshTemporaryPath } from "../../__fixture__.mjs";
import { Socket } from "net";
import { join as joinPath } from "path";
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

const repository = getFreshTemporaryPath();
const configuration = extendConfiguration(
  createConfiguration("/root"),
  {
    recorder: "process",
    output: {
      directory: "directory",
    },
  },
  repository,
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
          createConfiguration("/root"),
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
          createConfiguration("/root"),
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
    joinPath(repository, "directory", "anonymous.appmap.json"),
  );
  await readFileAsync(
    joinPath(repository, "directory", "anonymous-1.appmap.json"),
  );
  await readFileAsync(
    joinPath(repository, "directory", "map-name.appmap.json"),
  );
}
