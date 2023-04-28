// TODO: detect if preloaded with `--experimental-loader`
// NB: since 15.x we can use module.preloading
// const preloaded = Path.join(__dirname, "esm.js") in require.cache;
// preloaded ? : {hookESM: (instrumentAsync) => {
//   throw new ExternalAppmapError("lib/emitter/hook/esm.js must be preloaded with --experimental loader");
// }};

import { defineGlobal, writeGlobal } from "../../global/index.mjs";
import { toAbsoluteUrl, toDirectoryUrl } from "../../url/index.mjs";
import { InternalAppmapError } from "../../error/index.mjs";
import { readFile } from "../../file/index.mjs";
import { assert } from "../../util/index.mjs";
import { instrument, extractMissingUrlArray } from "../../frontend/index.mjs";

const { Map, String } = globalThis;

const forward = (_url, _location, content) => content;

export const unhook = (maybe_hidden) => {
  if (maybe_hidden !== null) {
    writeGlobal(maybe_hidden, forward);
  }
};

export const hook = (
  frontend,
  {
    hooks: {
      eval: { hidden, aliases },
    },
  },
) => {
  const enabled = aliases.length > 0;
  if (enabled) {
    assert(
      defineGlobal(
        hidden,
        (url, position, content) => {
          url = toAbsoluteUrl(`eval-${position}.js`, toDirectoryUrl(url));
          const cache = new Map([[url, String(content)]]);
          let complete = false;
          while (!complete) {
            const urls = extractMissingUrlArray(frontend, url, cache);
            if (urls.length === 0) {
              complete = true;
            } /* c8 ignore start */ else {
              for (const url of urls) {
                cache.set(url, readFile(url));
              }
            } /* c8 ignore stop */
          }
          return instrument(frontend, url, cache);
        },
        true,
      ),
      "global eval hook variable already defined",
      InternalAppmapError,
    );
  }
  return enabled ? hidden : null;
};
