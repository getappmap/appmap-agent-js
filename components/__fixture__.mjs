import { strict as Assert } from "assert";
import { tmpdir } from "os";
import { join as joinPath } from "path";

Error.stackTraceLimit = Infinity;

export const getFreshTemporaryPath = () =>
  joinPath(tmpdir(), Math.random().toString(36).substring(2));

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
