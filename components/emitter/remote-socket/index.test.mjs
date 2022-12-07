import { assertDeepEqual } from "../../__fixture__.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import { openEmitter, closeEmitter, sendEmitter } from "./index.mjs";

const {
  JSON: { stringify: stringifyJSON },
} = globalThis;

const configuration = extendConfiguration(
  createConfiguration("protocol://host/home"),
  {
    host: "localhost",
  },
  null,
);

const emitter = openEmitter(configuration);
sendEmitter(emitter, 123);
closeEmitter(emitter);
sendEmitter(emitter, 456);
assertDeepEqual(globalThis.SOCKET_TRACE, [
  { type: "open", host: "127.0.0.1", port: 0 },
  { type: "send", socket: "socket", message: "uuid" },
  {
    type: "send",
    socket: "socket",
    message: stringifyJSON(configuration),
  },
  { type: "send", socket: "socket", message: "123" },
  { type: "close", socket: "socket" },
]);
