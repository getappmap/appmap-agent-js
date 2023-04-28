/* eslint-disable no-import-assign */

// NB: To have any effect, this module needs `lib/node/loader-esm.mjs` to
// be ran as an `--experimented-loader`.
// It could be worthwhile to detect if this is indeed the case.
// We could use https://nodejs.org/api/modules.html#moduleispreloading.

// This module introduces state to `lib/node/loader-esm.mjs`.
// It is not very testable and hard to maintain.
// It could be avoided by passing this function to the entry point instead.
// However this would render the api more complex.
// So let's keep it like for the moment.

import {
  hooks,
  transformSourceDefault,
  loadDefault,
} from "../../../lib/node/loader-esm.mjs";
import { InternalAppmapError } from "../../error/index.mjs";
import { assert } from "../../util/index.mjs";
import { readFileAsync } from "../../file/index.mjs";
import { instrument, extractMissingUrlArray } from "../../frontend/index.mjs";
import { stringifyContent } from "./stringify.mjs";

const { Map } = globalThis;

let hooked = false;

export const unhook = (esm) => {
  if (esm) {
    assert(hooked, "esm not yet hooked", InternalAppmapError);
    hooks.load = loadDefault;
    hooks.transformSourceDefault = transformSourceDefault;
    hooked = false;
  }
};

export const hook = (frontend, { hooks: { esm } }) => {
  if (esm) {
    assert(!hooked, "esm already hooked", InternalAppmapError);
    hooked = esm;
    const transformModuleAsync = async (url, format, content) => {
      // We do not want to intrument commonjs here
      // because cjs has its own hook mechanism.
      if (format === "module") {
        const cache = new Map([[url, stringifyContent(content)]]);
        let complete = false;
        while (!complete) {
          const urls = extractMissingUrlArray(frontend, url, cache);
          if (urls.length === 0) {
            complete = true;
          } /* c8 ignore start */ else {
            for (const url of urls) {
              cache.set(url, await readFileAsync(url));
            }
          } /* c8 ignore start */
        }
        return instrument(frontend, url, cache);
      } else {
        return content;
      }
    };
    hooks.load = async (url, context, nextAsync) => {
      const { format, source } = await nextAsync(url, context, nextAsync);
      return {
        format,
        source: await transformModuleAsync(url, format, source),
      };
    };
    hooks.transformSource = async (content, context, nextAsync) => {
      const { format, url } = context;
      const { source } = await nextAsync(content, context, nextAsync);
      return {
        source: await transformModuleAsync(url, format, source),
      };
    };
  }
  return esm;
};
