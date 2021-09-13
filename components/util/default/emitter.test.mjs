import { strict as Assert } from "assert";
import { EventEmitter } from "events";
import { spyEmitter } from "./emitter.mjs";

const {
  deepEqual: assertDeepEqual,
  // equal: assertEqual,
  // throws: assertThrows
} = Assert;

const trace = [];
const generatePush = (element) => () => {
  trace.push(element);
};
const emitter = new EventEmitter();
spyEmitter(emitter, /^event$/u, generatePush("first"), generatePush("last"));
emitter.addListener("event", generatePush("append"));
emitter.prependListener("event", generatePush("prepend"));
emitter.emit("event");
assertDeepEqual(trace, ["first", "prepend", "append", "last"]);
