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
        // We assume utf8 encoding as node does:
        // https://github.com/nodejs/node/blob/c200106305f4367ba9ad8987af5139979c6cc40c/lib/internal/modules/cjs/loader.js#L1136
        //
        // Module._extensions['.js'] = function(module, filename) {
        //   // If already analyzed the source, then it will be cached.
        //   const cached = cjsParseCache.get(module);
        //   let content;
        //   if (cached?.source) {
        //     content = cached.source;
        //     cached.source = undefined;
        //   } else {
        //     content = fs.readFileSync(filename, 'utf8');
        //   }
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
