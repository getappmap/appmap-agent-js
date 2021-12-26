/* eslint-env node */

import { assertDeepEqual, makeAbsolutePath } from "../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Emitter from "./index.mjs";

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { createConfiguration } = await buildTestComponentAsync("configuration");
const { openEmitter, closeEmitter, sendEmitter, takeLocalEmitterTrace } =
  Emitter(dependencies);

const configuration = createConfiguration(makeAbsolutePath("root"));

const emitter = openEmitter(configuration);
sendEmitter(emitter, ["start", "record1", { data: {}, path: null }]);
sendEmitter(emitter, ["stop", "record1", { status: 0, errors: [] }]);
assertDeepEqual(takeLocalEmitterTrace(emitter, "record1"), {
  configuration,
  sources: [],
  events: [],
  termination: { status: 0, errors: [] },
});
sendEmitter(emitter, ["start", "record2", { data: {}, path: null }]);
closeEmitter(emitter);
sendEmitter(emitter, ["stop", "record2", { status: 0, errors: [] }]);
