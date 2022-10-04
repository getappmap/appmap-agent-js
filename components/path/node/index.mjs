const { URL, encodeURIComponent, decodeURIComponent } = globalThis;

const { search: __search } = new URL(import.meta.url);

// The following is cleaner:
// import {platform as getPlatform} from "os"
// But it prevents tests from overwriting os.platform
import { platform as getPlatform } from "os";
const { assert, constant, coalesce } = await import(
  `../../util/index.mjs${__search}`
);

const makeComponent = ({
  getShell,
  ipc,
  separator,
  splitter,
  root,
  forbidden,
}) => {
  const assertSegmentValidity = (segment) => {
    forbidden.lastIndex = 0;
    assert(!forbidden.test(segment), "invalid file name");
  };
  return {
    // TODO maybe we should rename path to platform to more accurate
    getShell,
    toIPCPath: (path) => `${ipc}${path}`,
    fromIPCPath: (path) => {
      assert(path.startsWith(ipc), "invalid ipc path");
      return path.substring(ipc.length);
    },
    makeSegment: (string, replace) => {
      forbidden.lastIndex = 0;
      return string.replace(forbidden, replace);
    },
    encodeSegment: (segment) => {
      assertSegmentValidity(segment);
      return encodeURIComponent(segment);
    },
    decodeSegment: (encoded_segment) => {
      const segment = decodeURIComponent(encoded_segment);
      assertSegmentValidity(segment);
      return segment;
    },
    joinPath: (segments) => segments.join(separator),
    splitPath: (path) => path.split(splitter),
    isAbsolutePath: (path) => root.test(path),
  };
};

/* c8 ignore start */
export const {
  getShell,
  toIPCPath,
  fromIPCPath,
  makeSegment,
  encodeSegment,
  decodeSegment,
  joinPath,
  splitPath,
  isAbsolutePath,
} = makeComponent(
  getPlatform() === "win32"
    ? {
        getShell: (env) => {
          const exec = coalesce(env, "comspec", "cmd.exe");
          return [
            exec,
            exec.endsWith("cmd") || exec.endsWith("cmd.exe") ? "/c" : "-c",
          ];
        },
        ipc: "\\\\.\\pipe\\",
        separator: "\\",
        splitter: /[\\/]/gu,
        root: /^([a-zA-Z]:[\\/]|[\\/][\\/])/u,
        forbidden: /[\u0000-\u001F\\/<>:"|?*]/gu,
      }
    : {
        getShell: constant(["/bin/sh", "-c"]),
        ipc: "",
        separator: "/",
        splitter: "/",
        root: /^\//u,
        forbidden: /[\u0000/]/gu,
      },
);
/* c8 ignore stop */
