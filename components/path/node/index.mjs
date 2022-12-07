import { platform as getPlatform, tmpdir as getTmp } from "node:os";

import { pathToFileURL as convertPathToFileUrlObject } from "node:url";

import * as Win32 from "./win32.mjs";
import * as Posix from "./posix.mjs";

export { fileURLToPath as convertFileUrlToPath } from "node:url";

export const convertPathToFileUrl = (path) =>
  convertPathToFileUrlObject(path).href;

/* c8 ignore start */
export const {
  getPathFilename,
  // This function convert an arbitrary string to a valid platform-specific filename.
  // For instance, it replaces path separator.
  sanitizePathFilename,
  getShell,
  toIpcPath,
  fromIpcPath,
  toDirectoryPath,
  toAbsolutePath,
  toRelativePath,
} = getPlatform() === "win32" ? Win32 : Posix;
/* c8 ignore stop */

export const getTmpPath = () => toDirectoryPath(getTmp());

export const getTmpUrl = () => convertPathToFileUrl(toDirectoryPath(getTmp()));

export const getCwdPath = ({ cwd: getCwd }) => toDirectoryPath(getCwd());

export const getCwdUrl = ({ cwd: getCwd }) =>
  convertPathToFileUrl(toDirectoryPath(getCwd()));

export const getPathBasename = (path) => {
  const filename = getPathFilename(path);
  if (filename === null) {
    return null;
  } else if (filename.includes(".")) {
    return filename.split(".")[0];
  } else {
    return filename;
  }
};

export const getPathExtension = (path) => {
  const filename = getPathFilename(path);
  if (filename === null) {
    return null;
  } else if (filename.includes(".")) {
    const segments = filename.split(".");
    segments[0] = "";
    return segments.join(".");
  } else {
    return null;
  }
};
