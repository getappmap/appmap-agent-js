const {
  undefined,
  Reflect: { getOwnPropertyDescriptor },
  /* c8 ignore start */
  Object: {
    hasOwn = (obj, key) => getOwnPropertyDescriptor(obj, key) !== undefined,
  },
  /* c8 ignore stop */
} = globalThis;

import { posix as PosixPath } from "node:path";

const { resolve: resolvePath, relative: unresolvePath } = PosixPath;

export const sanitizePathFilename = (filename) =>
  /^\.*$/u.test(filename)
    ? `...${filename}`
    : filename.replace(/\\/gu, "\\\\").replace(/\//gu, "\\");

export const getShell = (env) => (hasOwn(env, "SHELL") ? env.SHELL : "/bin/sh");

export const toIpcPath = (path) => path;

export const fromIpcPath = (path) => path;

export const toDirectoryPath = (path) =>
  path.endsWith("/") ? path : `${path}/`;

export const toAbsolutePath = (relative, base) => {
  const path = base.endsWith("/")
    ? resolvePath(base, relative)
    : resolvePath(base, "..", relative);
  return relative.endsWith("/") ? `${path}/` : path;
};

export const toRelativePath = (path, base) => {
  const relative = unresolvePath(
    base.endsWith("/") ? base : `${base}/..`,
    path,
  );
  if (relative === "") {
    return ".";
  } else if (path.endsWith("/")) {
    return `${relative}/`;
  } else {
    return relative;
  }
};

export const getPathFilename = (path) => {
  const segments = path.split("/");
  const filename = segments[segments.length - 1];
  return filename === "" ? null : filename;
};
