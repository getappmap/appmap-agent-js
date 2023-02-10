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

const message1 = {
  type: "start",
  track: "record",
  configuration,
};

const message2 = {
  type: "stop",
  track: "record",
  termination: { type: "manual" },
};

sendEmitter(emitter, message1);
sendEmitter(emitter, message2);

assertDeepEqual(takeLocalEmitterTrace(emitter, "record"), {
  configuration,
  messages: [message2],
});

closeEmitter(emitter);
