// NB: This module only set a global variable and should be paired with `--loader`.
// It could be worthwhile to detect if this is indeed the case.
// Since 15.x we can use module.preloading
// const preloaded = Path.join(__dirname, "esm.js") in require.cache;
// preloaded ? : {hookESM: (instrumentAsync) => {
//   throw new Error("lib/emitter/hook/esm.js must be preloaded with --experimental loader");
// }};

// NB: We could avoid using globals by making recorder components export `transformSource` and `load`.
// But this would complicate the interface of many components.
// Plus, all the other hooks have global side effects which cannot be avoided.

const {
  URL,
  Reflect: { defineProperty },
} = globalThis;

const { search: __search } = new URL(import.meta.url);

const { assert, hasOwnProperty } = await import(
  `../../util/index.mjs${__search}`
);
const { instrument } = await import(`../../agent/index.mjs${__search}`);
const { stringifyContent } = await import(`./stringify.mjs${__search}`);

export const unhook = (esm_hook_variable) => {
  if (esm_hook_variable !== null) {
    assert(
      hasOwnProperty(globalThis, esm_hook_variable),
      "global esm hook variable not defined",
    );
    delete globalThis[esm_hook_variable];
  }
};

export const hook = (agent, { hooks: { esm: esm_hook_variable } }) => {
  if (esm_hook_variable !== null) {
    assert(
      !hasOwnProperty(globalThis, esm_hook_variable),
      "global esm hook variable already defined",
    );
    const transformModule = (url, format, content) =>
      format === "module"
        ? instrument(agent, {
            url,
            type: "module",
            content: stringifyContent(content),
          })
        : content;
    defineProperty(globalThis, esm_hook_variable, {
      __proto__: null,
      writable: false,
      configurable: true,
      enumerable: false,
      value: {
        transformSource: async (content, context, nextAsync) => {
          const { format, url } = context;
          const { source } = await nextAsync(content, context, nextAsync);
          return {
            source: transformModule(url, format, source),
          };
        },
        load: async (url, context, nextAsync) => {
          const { format, source } = await nextAsync(url, context, nextAsync);
          return {
            format,
            source: transformModule(url, format, source),
          };
        },
      },
    });
  }
  return esm_hook_variable;
};
