/* global APPMAP_TRANSFORM_MODULE_ASYNC */

const _Buffer = Buffer;
const _ArrayBuffer = ArrayBuffer;
const _SharedArrayBuffer = SharedArrayBuffer;
const _Uint8Array = Uint8Array;

const { from: toBuffer } = Buffer;

export default (dependencies) => {
  const {
    interpretation: { runScript },
    log: { logInfo },
    expect: { expect },
  } = dependencies;

  const isBypassed = (enabled, format, transformModuleAsync) =>
    !enabled || format !== "module" || transformModuleAsync === null;

  const stringifyModule = (content) => {
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
  };

  return {
    createLoaderHooks: () => {
      // There is at least one case where this file gets loaded multiple times:
      // Sometimes npx will fake spawn its command into its own process.
      // Hence, we must check if the global marker variable is already defined.
      const enabled = typeof APPMAP_TRANSFORM_MODULE_ASYNC === "undefined";
      if (enabled) {
        logInfo(
          "Please, ignore node's deprecated warning about outdated transformSource loader hook (if present).",
        );
        runScript("let APPMAP_TRANSFORM_MODULE_ASYNC = null;");
      }
      return {
        stringifyModule, // for testing
        transformSourceAsync: async (content, context, transformAsync) => {
          const { format, url } = context;
          const { source } = await transformAsync(
            content,
            context,
            transformAsync,
          );
          return {
            source: isBypassed(enabled, format, APPMAP_TRANSFORM_MODULE_ASYNC)
              ? source
              : await APPMAP_TRANSFORM_MODULE_ASYNC(
                  url,
                  stringifyModule(source),
                ),
          };
        },
        loadAsync: async (url, context, loadAsync) => {
          const { format, source } = await loadAsync(url, context, loadAsync);
          return {
            format,
            source: isBypassed(enabled, format, APPMAP_TRANSFORM_MODULE_ASYNC)
              ? source
              : await APPMAP_TRANSFORM_MODULE_ASYNC(
                  url,
                  stringifyModule(source),
                ),
          };
        },
      };
    },
  };
};
