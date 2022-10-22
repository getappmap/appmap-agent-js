const {
  undefined,
  Reflect: { getOwnPropertyDescriptor },
  Error,
  Set,
  /* c8 ignore start */
  Object: {
    hasOwn = (obj, key) => getOwnPropertyDescriptor(obj, key) !== undefined,
  },
  /* c8 ignore stop */
} = globalThis;

import { win32 as Win32Path } from "node:path";

const { resolve: resolvePath, relative: unresolvePath } = Win32Path;

const getBasename = (filename) =>
  filename.includes(".") ? filename.split(".")[0] : filename;

const forbidden = new Set([
  "CON",
  "PRN",
  "AUX",
  "NUL",
  "COM1",
  "COM2",
  "COM3",
  "COM4",
  "COM5",
  "COM6",
  "COM7",
  "COM8",
  "COM9",
  "LPT1",
  "LPT2",
  "LPT3",
  "LPT4",
  "LPT5",
  "LPT6",
  "LPT7",
  "LPT8",
  "LPT9",
]);

export const sanitizePathFilename = (filename) => {
  filename = filename.replace(/[\u0000-\u001F,\u0080-\u009F/?<>\\:*|"]/gu, "-");
  if (
    filename === "" ||
    filename.endsWith(".") ||
    filename.endsWith(" ") ||
    forbidden.has(getBasename(filename).toUpperCase())
  ) {
    filename = `_${filename}_`;
  }
  return filename;
};

export const getShell = (env) =>
  hasOwn(env, "COMSPEC") ? env.COMSPEC : "cmd.exe";

const ipc = "\\\\.\\pipe\\";

export const toIpcPath = (path) => `${ipc}${path}`;

export const fromIpcPath = (path) => {
  if (path.startsWith(ipc)) {
    return path.substring(ipc.length);
  } else {
    throw new Error("not an ipc path");
  }
};

export const toDirectoryPath = (path) =>
  path.endsWith("/") || path.endsWith("\\") ? path : `${path}\\`;

export const toAbsolutePath = (relative, base) => {
  const path =
    base.endsWith("/") || base.endsWith("\\")
      ? resolvePath(base, relative)
      : resolvePath(base, "..", relative);
  return relative.endsWith("/") || relative.endsWith("\\") ? `${path}\\` : path;
};

export const toRelativePath = (path, base) => {
  const relative = unresolvePath(
    base.endsWith("/") || base.endsWith("\\") ? base : `${base}\\..`,
    path,
  );
  if (relative === "") {
    return ".";
  } else if (path.endsWith("/") || path.endsWith("\\")) {
    return `${relative}\\`;
  } else {
    return relative;
  }
};

export const getPathFilename = (path) => {
  const parts = /[\\/]([^\\/]*)$/u.exec(path);
  if (parts === null) {
    return null;
  } else {
    const filename = parts[1];
    return filename === "" ? null : filename;
  }
};
