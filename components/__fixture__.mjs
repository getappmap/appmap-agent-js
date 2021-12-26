import { strict as Assert } from "assert";
import { tmpdir as getTemporaryDirectory, platform as getPlatform } from "os";
import { sep as separator } from "path";

Error.stackTraceLimit = Infinity;

export const getFreshTemporaryPath = () => [
  getTemporaryDirectory(),
  Math.random().toString(36).substring(2)
].join(separator);

const root = getPlatform() === "win32" ? "C:" : "";
export const makeAbsolutePath = (...segments) => segments.length === 0
  ? `${root}${separator}`
  : [root, ... segments].join(separator);

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
