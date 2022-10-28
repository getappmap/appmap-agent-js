const {
  Buffer,
  Buffer: { from: toBuffer },
  ArrayBuffer,
  SharedArrayBuffer,
  Uint8Array,
  URL,
} = globalThis;

const { search: __search } = new URL(import.meta.url);

const { ExternalAppmapError } = await import(
  `../../error/index.mjs${__search}`
);
const { logError } = await import(`../../log/index.mjs${__search}`);

export const stringifyContent = (content) => {
  if (typeof content === "string") {
    return content;
  }
  if (content instanceof Uint8Array) {
    content = content.buffer;
  }
  if (content instanceof SharedArrayBuffer || content instanceof ArrayBuffer) {
    content = toBuffer(content);
  }
  if (content instanceof Buffer) {
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
  } else {
    logError(
      "Expected module content to be either: a string, a UintArray, a ArrayBuffer, a SharedArrayBuffer, or a Buffer. Got: %o",
      content,
    );
    throw new ExternalAppmapError("Invalid module content");
  }
};
