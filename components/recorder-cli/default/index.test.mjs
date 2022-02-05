/* eslint-env node */

import { EventEmitter } from "events";
import { assertThrow, assertEqual } from "../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import RecorderCLI from "./index.mjs";

const { createRecorder, generateRequestAsync, startTrack, stopTrack } =
  RecorderCLI(await buildTestDependenciesAsync(import.meta.url));

const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration");

const mock_process = new EventEmitter();
Object.assign(mock_process, {
  pid: process.pid,
  cwd: process.cwd,
  argv: ["node", "/main.js"],
  version: process.version,
});

assertEqual(
  createRecorder(
    mock_process,
    extendConfiguration(
      createConfiguration("file:///home"),
      {
        processes: false,
      },
      "file:///base",
    ),
  ),
  null,
);

const configuration = extendConfiguration(
  createConfiguration("file:///home"),
  {
    hooks: {
      cjs: false,
      esm: false,
      apply: false,
      http: false,
      pg: false,
      mysql: false,
    },
  },
  "file:///base",
);

const recorder = createRecorder(mock_process, configuration);

startTrack(recorder, "track1", { path: null, data: {} });
const requestAsync = generateRequestAsync(recorder);
assertThrow(() => {
  requestAsync("GET", "/", {});
});
stopTrack(recorder, "track1", { status: 123, errors: [] });
mock_process.emit("uncaughtExceptionMonitor", new Error("BOUM"));
startTrack(recorder, "track2", { path: null, data: {} });
mock_process.emit("exit", 1, null);
