import { EventEmitter } from "events";

import { assertThrow, assertEqual } from "../../__fixture__.mjs";
import { convertFileUrlToPath } from "../../path/index.mjs?env=test";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs?env=test";
import {
  createRecorder,
  generateRequestAsync,
  recordStartTrack,
  recordStopTrack,
} from "./index.mjs?env=test";

const {
  process: { version },
  Object: { assign },
  Error,
} = globalThis;

const mock_process = new EventEmitter();

assign(mock_process, {
  pid: 1234,
  cwd: () => convertFileUrlToPath("file:///w:/cwd"),
  argv: ["node", "main.js"],
  version,
});

assertEqual(
  createRecorder(
    mock_process,
    extendConfiguration(
      createConfiguration("file:///w:/home/"),
      {
        processes: false,
      },
      "file:///w:/base/",
    ),
  ),
  null,
);

const configuration = extendConfiguration(
  createConfiguration("file:///w:/home/"),
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
  "file:///w:/base/",
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
