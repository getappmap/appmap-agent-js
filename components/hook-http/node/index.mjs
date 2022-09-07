import { Buffer } from "buffer";

const { from: toBuffer, concat: concatBuffer } = Buffer;
const {
  Object: { fromEntries },
  TextDecoder,
  Reflect: { apply },
  JSON: { parse: parseJSON },
} = globalThis;

export default (dependencies) => {
  const {
    log: { logWarning },
    patch: { patch },
  } = dependencies;

  const normalizeChunk = (chunk, encoding) =>
    typeof chunk === "string" ? toBuffer(chunk, encoding) : chunk;

  const spyReadable = (readable, callback) => {
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

  const spyWritable = (writable, callback1) => {
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

  const parseJSONSafe = (string, recovery) => {
    try {
      return parseJSON(string);
    } catch (error) {
      logWarning("Could not parse as JSON %j >> %e", string, error);
      return recovery;
    }
  };

  const decodeSafe = (buffer, encoding, recovery) => {
    try {
      return new TextDecoder(encoding).decode(buffer);
    } catch (error) {
      logWarning("Could not decode as %j buffer >> %e", encoding, error);
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

  const parseContentType = (content_type) => {
    const segments = content_type.toLowerCase().split(";");
    const { type, subtype } = parseContentTypeHead(segments.shift());
    return {
      type,
      subtype,
      parameters: fromEntries(segments.flatMap(parseContentTypeParameter)),
    };
  };

  return {
    parseContentType,
    parseJSONSafe,
    decodeSafe,
    spyReadable,
    spyWritable,
  };
};
