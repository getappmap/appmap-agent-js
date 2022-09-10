/* eslint-env node */

const {
  Object: {assign},
  Error,
  process,
} = globalThis;

import { EventEmitter } from "events";
import { pathToFileURL } from "url";
import { assertThrow, assertEqual } from "../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import RecorderCLI from "./index.mjs";

const {
  createRecorder,
  generateRequestAsync,
  recordStartTrack,
  recordStopTrack,
} = RecorderCLI(await buildTestDependenciesAsync(import.meta.url));

const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration");

const mock_process = new EventEmitter();
assign(mock_process, {
  pid: process.pid,
  cwd: process.cwd,
  argv: process.argv,
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
      pathToFileURL(process.cwd()),
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

recordStartTrack(recorder, "track1", {}, null);
const requestAsync = generateRequestAsync(recorder);
assertThrow(() => {
  requestAsync("GET", "/", {});
});
recordStopTrack(recorder, "track1", 123);
mock_process.emit("uncaughtExceptionMonitor", new Error("BOUM"));
recordStartTrack(recorder, "track2", {}, null);
mock_process.emit("exit", 1, null);
