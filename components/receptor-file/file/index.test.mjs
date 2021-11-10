import { tmpdir } from "os";
import { readFile } from "fs/promises";
import { strict as Assert } from "assert";
import { Socket } from "net";
import { createMessage } from "net-socket-messaging";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Receptor from "./index.mjs";

const {
  // equal:assertEqual,
} = Assert;

const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration");

const {
  openReceptorAsync,
  adaptReceptorConfiguration,
  minifyReceptorConfiguration,
  closeReceptorAsync,
} = Receptor(await buildTestDependenciesAsync(import.meta.url));

const repository = `${tmpdir()}/${Math.random().toString(36).substring(2)}`;
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
        { path: null, data: { "map-name": "map-name" } },
      ]),
    ),
  );
  await new Promise((resolve) => {
    socket.on("close", resolve);
    socket.end();
  });
  await closeReceptorAsync(receptor);
  await readFile(`${repository}/directory/anonymous.appmap.json`);
  await readFile(`${repository}/directory/anonymous-1.appmap.json`);
  await readFile(`${repository}/directory/map-name.appmap.json`);
}
