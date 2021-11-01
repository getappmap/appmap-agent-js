import { readFileSync as readFile } from "fs";

const _Buffer = Buffer;
const _decodeURIComponent = decodeURIComponent;
const _URL = URL;

export default (dependencies) => {
  const {
    util: { makeLeft, makeRight },
    expect: { expect },
  } = dependencies;
  const parseDataPath = (path) => {
    const parts = /^([^,]*),(.*)$/u.exec(path);
    expect(parts !== null, "Invalid data url pathname: %j.", path);
    const [, head, body] = parts;
    if (head.endsWith(";base64")) {
      expect(
        head.toLowerCase().endsWith(";charset=utf-8;base64"),
        "Only utf-8 encoding is currently supported, got: %j.",
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
