import { hasOwnProperty } from "./object.mjs";

export function isFileNotFound(error) {
  // on Windows sometimes the error code is UNKNOWN
  return (
    hasOwnProperty(error, "code") &&
    (error.code === "ENOENT" || error.code === "UNKNOWN")
  );
}
