import { strict as Assert } from "assert";
import { tmpdir as getTemporaryDirectory , platform as getPlatform } from "os";
import { pathToFileURL , fileURLToPath } from "url";

Error.stackTraceLimit = Infinity;

export const convertPort = (port) =>
  typeof port === "string"
    ? `${getPlatform() === "win32" ? "\\\\.\\pipe\\" : ""}${fileURLToPath(
        port,
      )}`
    : port;


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
