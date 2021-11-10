import { readFileSync as readFile } from "fs";

const _Buffer = Buffer;
const _decodeURIComponent = decodeURIComponent;
const _URL = URL;

export default (dependencies) => {
  const {
    log: { logGuardWarning },
    util: { makeLeft, makeRight },
    expect: { expect },
  } = dependencies;
  const parseDataPath = (path) => {
    const parts = /^([^,]*),(.*)$/u.exec(path);
    expect(parts !== null, "Invalid data url pathname: %j.", path);
    const [, head, body] = parts;
    if (head.endsWith(";base64")) {
      logGuardWarning(
        !head.toLowerCase().includes(";charset=utf-8;"),
        "Data url for source map is encoded as base64 and does not declare UTF-8 as its character encoding, will try to use UTF-8 anyway >> %s",
        path,
      );
      return _Buffer.from(body, "base64").toString("utf8");
    }
    return _decodeURIComponent(body);
  };
  return {
    readFile: (url) => {
      const { protocol, pathname: path } = new _URL(url);
      if (protocol === "data:") {
        return makeRight({ url, content: parseDataPath(path) });
      }
      expect(
        protocol === "file:",
        "Expected url protocol to be either 'data:' or 'file:', got: %j.",
        url,
      );
      try {
        return makeRight({
          url,
          content: readFile(path, "utf8"),
        });
      } catch ({ message }) {
        return makeLeft(message);
      }
    },
  };
};
