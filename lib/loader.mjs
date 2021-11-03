/* global APPMAP_TRANSFORM_MODULE_ASYNC */

const _Buffer = Buffer;
const _ArrayBuffer = ArrayBuffer;
const _SharedArrayBuffer = SharedArrayBuffer;
const _Uint8Array = Uint8Array;

const { from: toBuffer } = Buffer;

import { runInThisContext } from "vm";

// There is at least one case where this file gets loaded multiple times:
// Sometimes npx will fake spawn its command into its own process.
// Hence, we must check if the global marker variable is already defined.
const enabled = typeof APPMAP_TRANSFORM_MODULE_ASYNC === "undefined";

if (enabled) {
  runInThisContext("let APPMAP_TRANSFORM_MODULE_ASYNC = null;");
}

const stringify = (content) => {
  if (typeof content === "string") {
    return content;
  }
  if (content instanceof _Uint8Array) {
    content = content.buffer;
  }
  if (
    content instanceof _ArrayBuffer ||
    content instanceof _SharedArrayBuffer
  ) {
    content = toBuffer(content);
  }
  if (content instanceof _Buffer) {
    return content.toString("utf8");
  }
  throw new Error("Could not convert source content to string");
};

const isBypassed = (format) =>
  !enabled || format !== "module" || APPMAP_TRANSFORM_MODULE_ASYNC === null;

export const transformSource = async (content, context, transformAsync) => {
  const { format, url } = context;
  const { source } = await transformAsync(content, context, transformAsync);
  return {
    source: isBypassed(format)
      ? source
      : await APPMAP_TRANSFORM_MODULE_ASYNC(url, stringify(source)),
  };
};

export const load = async (url, context, loadAsync) => {
  const { format, source } = await loadAsync(url, context, loadAsync);
  return {
    format,
    source: isBypassed(format)
      ? source
      : await APPMAP_TRANSFORM_MODULE_ASYNC(url, stringify(source)),
  };
};
