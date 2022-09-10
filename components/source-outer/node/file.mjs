import { readFileSync } from "fs";
import { fileURLToPath } from "url";

const {
  JSON: {stringify:stringifyJSON},
  Buffer,
  decodeURIComponent,
  URL,
} = globalThis;

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
      return Buffer.from(body, "base64").toString("utf8");
    }
    return decodeURIComponent(body);
  };
  return {
    readFileSync: (url, base) => {
      const { protocol, pathname: path } = new URL(url);
      if (protocol === "data:") {
        return makeRight({ url: base, content: parseDataPath(path) });
      } else if (protocol === "file:") {
        try {
          return makeRight({
            url,
            content: readFileSync(fileURLToPath(url), "utf8"),
          });
        } catch ({ message }) {
          return makeLeft(message);
        }
      } else {
        return makeLeft(
          `Cannot read file url with a protocol different than 'data:' or 'file:', got: ${stringifyJSON(
            url,
          )}`,
        );
      }
    },
  };
};
