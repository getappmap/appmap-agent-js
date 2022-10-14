import { strict as Assert } from "assert";

const { Error, Infinity } = globalThis;

Error.stackTraceLimit = Infinity;

export const {
  ok: assert,
  match: assertMatch,
  fail: assertFail,
  deepEqual: assertDeepEqual,
  equal: assertEqual,
  throws: assertThrow,
  rejects: assertReject,
  notEqual: assertNotEqual,
} = Assert;
