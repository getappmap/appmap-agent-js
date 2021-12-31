import { strict as Assert } from "assert";
import { tmpdir as getTemporaryDirectory } from "os";
import { pathToFileURL } from "url";

Error.stackTraceLimit = Infinity;

export const getFreshTemporaryURL = (extension = "") =>
  `${pathToFileURL(getTemporaryDirectory())}/${Math.random()
    .toString(36)
    .substring(2)}${extension}`;

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
