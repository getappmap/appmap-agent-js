import { strict as Assert } from "assert";
import { buildTestDependenciesAsync } from "../../build.mjs";
import { EventEmitter } from "events";
import Emitter from "./index.mjs";

const {
  deepEqual: assertDeepEqual,
  // equal: assertEqual,
  // throws: assertThrows
} = Assert;

const { spyEmitter, spyFlattenEmitterList } = Emitter(
  await buildTestDependenciesAsync(import.meta.url),
);

// spyEmitter //
{
  const trace = [];
  const generatePush =
    (element) =>
    (...args) => {
      trace.push(element, args);
    };
  const emitter = new EventEmitter();
  spyEmitter(emitter, /^foo/u, generatePush("first"), generatePush("last"));
  emitter.addListener("foo", generatePush("append"));
  emitter.prependListener("foo", generatePush("prepend"));
  emitter.emit("foo", 123);
  emitter.emit("bar", 456);
  assertDeepEqual(trace, [
    "first",
    [emitter, "foo", [123], {}],
    "prepend",
    [123],
    "append",
    [123],
    "last",
    [emitter, "foo", [123], {}],
  ]);
}

// spyFlattenEmitter //
{
  const trace = [];
  const generatePush = (element) => (emitter, name) => {
    trace.push(element, name);
  };
  const emitter1 = new EventEmitter();
  const emitter2 = new EventEmitter();
  spyFlattenEmitterList(
    [emitter1, emitter2],
    /^/u,
    generatePush("first"),
    generatePush("last"),
  );
  emitter1.on("foo", () => {
    emitter1.emit("bar");
    emitter2.emit("foo");
  });
  emitter1.emit("foo");
  assertDeepEqual(trace, ["first", "foo", "last", "foo"]);
}
