const { Error, decodeURIComponent, URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

import { readFileSync as readFileInner } from "fs";
import { readFile as readFileInnerAsync } from "fs/promises";
import { Buffer } from "node:buffer";
const { logWarningWhen } = await import(`../../log/index.mjs${__search}`);

const { from: toBuffer } = Buffer;

const splitDataPath = (path) => {
  const index = path.indexOf(",");
  return {
    head: path.substring(0, index),
    body: path.substring(index + 1),
  };
};

const generateReadFile = (readFile) => (url) => {
  const url_obj = new URL(url);
  if (url_obj.protocol === "file:") {
    return readFile(url_obj, "utf8");
  } else if (url_obj.protocol === "data:") {
    const { head, body } = splitDataPath(url_obj.pathname);
    if (head.endsWith(";base64")) {
      logWarningWhen(
        !head.toLowerCase().includes(";charset=utf-8;") &&
          !head.toLowerCase().includes(";charset=utf8;"),
        "Data url is encoded as base64 and does not declare UTF-8 as its character encoding, will try to use UTF-8 anyway >> %s",
        url,
      );
      return toBuffer(body, "base64").toString("utf8");
    } else {
      return decodeURIComponent(body);
    }
  } else {
    // This file is meant to be used at the same
    //   abstraction level as a node library.
    // Hence, this is delibearately left as an unknown error.
    // ie: not an External/Internal AppmapError.
    throw new Error("unsupported protocol");
  }
};

export const readFile = generateReadFile(readFileInner);

export const readFileAsync = generateReadFile(readFileInnerAsync);
