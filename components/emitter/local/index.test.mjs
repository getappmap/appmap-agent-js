import { assertDeepEqual } from "../../__fixture__.mjs";
import { createConfiguration } from "../../configuration/index.mjs";
import {
  openEmitter,
  closeEmitter,
  sendEmitter,
  takeLocalEmitterTrace,
} from "./index.mjs";

const configuration = createConfiguration("protocol://host/home");

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
  termination: { type: "manual" },
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
    termination: { type: "manual" },
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
  termination: { type: "manual" },
});
