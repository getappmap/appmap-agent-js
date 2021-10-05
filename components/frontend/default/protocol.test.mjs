import { strict as Assert } from "assert";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Protocol from "./protocol.mjs";

const { deepEqual: assertDeepEqual } = Assert;

const dependencies = await buildTestDependenciesAsync(import.meta.url);

const {
  startTrackProtocol,
  registerFileProtocol,
  recordEventProtocol,
  stopTrackProtocol,
} = Protocol(dependencies);

assertDeepEqual(startTrackProtocol("key", { path: null, options: {} }), [
  "start",
  "key",
  { path: null, options: {} },
]);
assertDeepEqual(registerFileProtocol("file"), ["file", "file"]);
assertDeepEqual(
  recordEventProtocol("begin", "index", "time", "bundle", "data"),
  ["event", "begin", "index", "time", "bundle", "data"],
);
assertDeepEqual(stopTrackProtocol("key", { errors: [], status: 0 }), [
  "stop",
  "key",
  { errors: [], status: 0 },
]);
