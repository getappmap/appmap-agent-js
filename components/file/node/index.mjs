import { readFileSync as readFile } from "fs";
import { readFile as readFileAsync } from "fs/promises";
import { Buffer } from "node:buffer";

const { Error, decodeURIComponent, URL } = globalThis;

const { from: toBuffer } = Buffer;

export default (dependencies) => {
  const {
    log: { logGuardWarning },
  } = dependencies;

  const splitDataPath = (path) => {
    const index = path.indexOf(",");
    return {
      head: path.substring(0, index),
      body: path.substring(index + 1),
    };
  };

  const generateReadFile = (readFile) => (url) => {
    const url_object = new URL(url);
    const { protocol, pathname: path } = url_object;
    if (protocol === "file:") {
      return readFile(url_object, "utf8");
    } else if (protocol === "data:") {
      const { head, body } = splitDataPath(path);
      if (head.endsWith(";base64")) {
        logGuardWarning(
          !head.toLowerCase().includes(";charset=utf-8;"),
          "Data url is encoded as base64 and does not declare UTF-8 as its character encoding, will try to use UTF-8 anyway >> %s",
          path,
        );
        return toBuffer(body, "base64").toString("utf8");
      } else {
        return decodeURIComponent(body);
      }
    } else {
      throw new Error("unsupported protocol");
    }
  };

  return {
    readFile: generateReadFile(readFile),
    readFileAsync: generateReadFile(readFileAsync),
  };
};
