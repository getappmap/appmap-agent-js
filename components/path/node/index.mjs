// The following is cleaner:
// import {platform as getPlatform} from "os"
// But it does enable tests to overwrite os.platform
import OperatingSystem from "os";
const { platform: getPlatform } = OperatingSystem;

const _encodeURIComponent = encodeURIComponent;
const _decodeURIComponent = decodeURIComponent;

export default (dependencies) => {
  const {
    util: { assert },
  } = dependencies;
  const makeComponent = ({ ipc, separator, splitter, root, forbidden }) => {
    const assertSegmentValidity = (segment) => {
      forbidden.lastIndex = 0;
      assert(!forbidden.test(segment), "invalid file name");
    };
    return {
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
        return _encodeURIComponent(segment);
      },
      decodeSegment: (encoded_segment) => {
        const segment = _decodeURIComponent(encoded_segment);
        assertSegmentValidity(segment);
        return segment;
      },
      joinPath: (segments) => segments.join(separator),
      splitPath: (path) => path.split(splitter),
      isAbsolutePath:
        typeof root === "string"
          ? (path) => path.startsWith(root)
          : (path) => root.test(path),
    };
  };
  if (getPlatform() === "win32") {
    return makeComponent({
      ipc: "\\\\.\\pipe\\",
      separator: "\\",
      splitter: /[\\/]/gu,
      root: /^([a-zA-Z]:[\\/]|[\\/][\\/])/u,
      forbidden: /[\u0000-\u001F\\/<>:"|?*]/gu,
    });
  } else {
    return makeComponent({
      ipc: "",
      separator: "/",
      splitter: "/",
      root: "/",
      forbidden: /[\u0000/]/gu,
    });
  }
};
