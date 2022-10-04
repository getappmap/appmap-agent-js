const {
  Buffer: { from: toBuffer, concat: concatBuffer },
  Object: { fromEntries, entries: toEntries },
  TextDecoder,
  Reflect: { apply },
  JSON: { parse: parseJSON },
  Math: { round },
  undefined,
  URL,
} = globalThis;

const { search: __search } = new URL(import.meta.url);

const { toNumber, jsonifyNumber, toString } = await import(
  `../../util/index.mjs${__search}`
);
const { logWarning } = await import(`../../log/index.mjs${__search}`);
const { patch } = await import(`../../patch/index.mjs${__search}`);

const normalizeChunk = (chunk, encoding) =>
  typeof chunk === "string" ? toBuffer(chunk, encoding) : chunk;

export const spyReadable = (readable, callback) => {
  const buffers = [];
  patch(
    readable,
    "push",
    (original_push) =>
      function (chunk, encoding) {
        if (chunk === null) {
          callback(concatBuffer(buffers));
        } else {
          buffers.push(normalizeChunk(chunk, encoding));
        }
        return apply(original_push, this, [chunk, encoding]);
      },
  );
};

export const spyWritable = (writable, callback1) => {
  const buffers = [];
  patch(
    writable,
    "write",
    (original_write) =>
      function (chunk, encoding, callback2) {
        buffers.push(normalizeChunk(chunk, encoding));
        return apply(original_write, this, [chunk, encoding, callback2]);
      },
  );
  patch(
    writable,
    "end",
    (original_end) =>
      function (chunk, encoding, callback2) {
        if (chunk !== null && chunk !== undefined) {
          buffers.push(normalizeChunk(chunk, encoding));
        }
        callback1(concatBuffer(buffers));
        return apply(original_end, this, [chunk, encoding, callback2]);
      },
  );
};

export const parseJSONSafe = (string, recovery) => {
  try {
    return parseJSON(string);
  } catch (error) {
    logWarning("Could not parse as JSON %j >> %O", string, error);
    return recovery;
  }
};

export const decodeSafe = (buffer, encoding, recovery) => {
  try {
    return new TextDecoder(encoding).decode(buffer);
  } catch (error) {
    logWarning("Could not decode as %j buffer >> %O", encoding, error);
    return recovery;
  }
};

const parseContentTypeHead = (head) => {
  const parts = /^ *([a-zA-Z-]+) *\/ *([a-zA-Z-]+) *$/u.exec(head);
  if (parts === null) {
    logWarning("Could not parse content-type head %j", head);
    return { type: "text", subtype: "plain" };
  } else {
    return { type: parts[1], subtype: parts[2] };
  }
};

const parseContentTypeParameter = (parameter) => {
  const parts = /^ *([a-zA-Z0-9-]+) *= *([a-zA-Z0-9-]+) *$/u.exec(parameter);
  if (parts === null) {
    logWarning("Could not parse content-type parameter %j", parameter);
    return [];
  } else {
    return [[parts[1], parts[2]]];
  }
};

export const parseContentType = (content_type) => {
  const segments = content_type.toLowerCase().split(";");
  const { type, subtype } = parseContentTypeHead(segments.shift());
  return {
    type,
    subtype,
    parameters: fromEntries(segments.flatMap(parseContentTypeParameter)),
  };
};

const isStringKeyEntry = ({ 0: key }) => typeof key === "string";

const toStringValueEntry = ({ 0: key, 1: value }) => [key, toString(value)];

export const formatHeaders = (headers) =>
  fromEntries(
    toEntries(headers).filter(isStringKeyEntry).map(toStringValueEntry),
  );

const replacements = {
  NaN: 0,
  NEGATIVE_INFINITY: 0,
  POSITIVE_INFINITY: 0,
};

export const formatStatus = (any) =>
  round(jsonifyNumber(toNumber(any), replacements));
