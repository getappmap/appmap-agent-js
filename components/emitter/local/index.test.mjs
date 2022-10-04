import { assertDeepEqual } from "../../__fixture__.mjs";
import { createConfiguration } from "../../configuration/index.mjs?env=test";
import {
  openEmitter,
  closeEmitter,
  sendEmitter,
  takeLocalEmitterTrace,
} from "./index.mjs?env=test";

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
