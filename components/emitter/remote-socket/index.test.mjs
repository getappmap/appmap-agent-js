import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import { assertDeepEqual } from "../../__fixture__.mjs";
import Emitter from "./index.mjs";

const {
  JSON: { stringify: stringifyJSON },
} = globalThis;

const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration");

const { openEmitter, closeEmitter, sendEmitter } = Emitter(
  await buildTestDependenciesAsync(import.meta.url),
);

const configuration = extendConfiguration(
  createConfiguration("file:///home"),
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
