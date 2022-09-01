/* eslint-env node */

import { assertDeepEqual } from "../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Emitter from "./index.mjs";

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { createConfiguration } = await buildTestComponentAsync("configuration");
const { openEmitter, closeEmitter, sendEmitter, takeLocalEmitterTrace } =
  Emitter(dependencies);

const configuration = createConfiguration("file:///home");

const emitter = openEmitter(configuration);

sendEmitter(emitter, {
  type: "start",
  track: "record1",
  configuration: {},
  url: null,
});

sendEmitter(emitter, {
  type: "stop",
  track: "record1",
  status: 0,
});

assertDeepEqual(takeLocalEmitterTrace(emitter, "record1"), [
  {
    type: "start",
    track: "record1",
    configuration: {},
    url: null,
  },
  {
    type: "stop",
    track: "record1",
    status: 0,
  },
]);

sendEmitter(emitter, {
  type: "start",
  track: "record2",
  configuration: {},
  url: null,
});

closeEmitter(emitter);

sendEmitter(emitter, {
  type: "stop",
  track: "record2",
  status: 0,
});
