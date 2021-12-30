import { strict as Assert } from "assert";
import { tmpdir as getTemporaryDirectory, platform as getPlatform } from "os";
import { pathToFileURL } from "url";

Error.stackTraceLimit = Infinity;

export const getFreshTemporaryURL = () => `${pathToFileURL(getTemporaryDirectory())}/${Math.random().toString(36).substring(2)}`;

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
