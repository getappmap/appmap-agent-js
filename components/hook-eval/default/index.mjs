// TODO: detect if preloaded with `--experimental-loader`
// NB: since 15.x we can use module.preloading
// const preloaded = Path.join(__dirname, "esm.js") in require.cache;
// preloaded ? : {hookESM: (instrumentAsync) => {
//   throw new ExternalAppmapError("lib/emitter/hook/esm.js must be preloaded with --experimental loader");
// }};

import { toAbsoluteUrl, toDirectoryUrl } from "../../url/index.mjs";
import { getUuid } from "../../uuid/index.mjs";
import { InternalAppmapError } from "../../error/index.mjs";
import { assert, hasOwnProperty } from "../../util/index.mjs";
import { instrument } from "../../agent/index.mjs";

const {
  String,
  Reflect: { defineProperty },
} = globalThis;

const forward = (_url, _location, content) => content;

export const unhook = (maybe_hidden) => {
  if (maybe_hidden !== null) {
    assert(
      hasOwnProperty(globalThis, maybe_hidden),
      "global eval hook variable not defined",
      InternalAppmapError,
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
      InternalAppmapError,
    );
    defineProperty(globalThis, hidden, {
      __proto__: null,
      writable: false,
      enumerable: false,
      configurable: true,
      value: (url, location, content) =>
        instrument(
          agent,
          {
            // We need to use a unique filename because
            // a single eval call location may evaluate
            // multiple different code.
            url: toAbsoluteUrl(
              `eval-${location}-${getUuid()}.js`,
              toDirectoryUrl(url),
            ),
            type: "script",
            content: String(content),
          },
          null,
        ),
    });
  }
  return enabled ? hidden : null;
};
