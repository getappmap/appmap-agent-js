// TODO: detect if preloaded with `--experimental-loader`
// NB: since 15.x we can use module.preloading
// const preloaded = Path.join(__dirname, "esm.js") in require.cache;
// preloaded ? : {hookESM: (instrumentAsync) => {
//   throw new Error("lib/emitter/hook/esm.js must be preloaded with --experimental loader");
// }};

const {
  String,
  URL,
  Reflect: { defineProperty },
} = globalThis;

const { search: __search } = new URL(import.meta.url);

const { assert, hasOwnProperty } = await import(
  `../../util/index.mjs${__search}`
);
const { instrument } = await import(`../../agent/index.mjs${__search}`);

const forward = (_url, content) => content;

export const unhook = (maybe_hidden) => {
  if (maybe_hidden !== null) {
    assert(
      hasOwnProperty(globalThis, maybe_hidden),
      "global eval hook variable not defined",
    );
    defineProperty(globalThis, maybe_hidden, {
      __proto__: null,
      writable: false,
      enumerable: false,
      configurable: true,
      value: forward,
    });
  }
};

export const hook = (
  agent,
  {
    hooks: {
      eval: { hidden, aliases },
    },
  },
) => {
  const enabled = aliases.length > 0;
  if (enabled) {
    assert(
      !hasOwnProperty(globalThis, hidden),
      "global eval hook variable already defined",
    );
    defineProperty(globalThis, hidden, {
      __proto__: null,
      writable: false,
      enumerable: false,
      configurable: true,
      value: (url, content) =>
        instrument(agent, {
          url,
          type: "script",
          content: String(content),
        }),
    });
  }
  return enabled ? hidden : null;
};
