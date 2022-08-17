const _Buffer = Buffer;
const _ArrayBuffer = ArrayBuffer;
const _SharedArrayBuffer = SharedArrayBuffer;
const _Uint8Array = Uint8Array;

const { from: toBuffer } = Buffer;

export default (dependencies) => {
  const {
    expect: { expect },
  } = dependencies;
  return {
    stringifyContent: (content) => {
      if (typeof content === "string") {
        return content;
      }
      if (content instanceof _Uint8Array) {
        content = content.buffer;
      }
      if (
        content instanceof _SharedArrayBuffer ||
        content instanceof _ArrayBuffer
      ) {
        content = toBuffer(content);
      }
      if (content instanceof _Buffer) {
        return content.toString("utf8");
      }
      expect(
        false,
        "Expected module content to be either: a string, a UintArray, a ArrayBuffer, a SharedArrayBuffer, or a Buffer. Got: %o",
        content,
      );
    },
  };
};
