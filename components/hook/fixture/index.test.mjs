import { strict as Assert } from "assert";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Hook from "./index.mjs";

const { deepEqual: assertDeepEqual } = Assert;

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { sendEmitter } = await buildTestComponentAsync("emitter");
const { testHookAsync, makeEvent } = Hook(dependencies);
let emitter = null;
const event = ["begin", 123, 0, "bundle", null];
assertDeepEqual(
  await testHookAsync(
    (_emitter) => {
      emitter = _emitter;
    },
    () => {
      emitter = null;
    },
    {},
    async () => {
      sendEmitter(emitter, ["event", ...event]);
    },
  ),
  { files: [], events: [makeEvent(...event)] },
);
