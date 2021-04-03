import { strict as Assert } from 'assert';
import { EventEmitter } from "events";
import setup from "../../../../../../lib/client/es2015/node/setup.js";


const ESCAPE_PREFIX = "escape_prefix";
const TRACE_IDENTIFIER = "__TRACE__";
const PID = "pid";
const ENGINE_VERSION = "engine-version";
const ECMASCRIPT_VERSION = 123;

global[TRACE_IDENTIFIER] = [];
const emitter = new EventEmitter();
emitter.env = {
  APPMAP_CHANNEL: "test",
  APPMAP_TRACE_IDENTIFIER: TRACE_IDENTIFIER,
  APPMAP_ESCAPE_PREFIX: ESCAPE_PREFIX,
  APPMAP_ECMASCRIPT_VERSION: 123
};
emitter.pid = PID;
emitter.version = ENGINE_VERSION;
const MESSAGE = "BOUM";

setup(emitter);
Assert.throws(
  () => emitter.emit("uncaughtException", new Error(MESSAGE), "origin"),
  new Error(MESSAGE));
Assert.throws(
  () => emitter.emit("uncaughtException", MESSAGE, "origin"));
emitter.emit("SIGINT");
emitter.emit("SIGTERM");
emitter.emit("exit", "code", "origin");
Assert.deepEqual(
  global[TRACE_IDENTIFIER],
  [
    ["initialize", {
      pid: PID,
      engine: `node@${ENGINE_VERSION}`,
      prefix: ESCAPE_PREFIX,
      ecmascript: ECMASCRIPT_VERSION
    }],
    ["terminate", {type:"exception", error: "BOUM", origin:"origin"}]],
);
