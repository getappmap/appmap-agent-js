/* eslint-disable no-import-assign */

// NB: To have any effect, this module needs `lib/node/loader-esm.mjs` to
// executed as an `--experimented-loader`.
// It could be worthwhile to detect if this is indeed the case.
// We could use https://nodejs.org/api/modules.html#moduleispreloading.

// This module introduces state to `lib/node/loader-esm.mjs`.
// It is not very testable and hard to maintain.
// It could be avoided by bubling this function instead.
// However this would complexify the api.
// So let's keep it like for the moment.

import {
  hooks,
  transformSourceDefault,
  loadDefault,
} from "../../../lib/node/loader-esm.mjs";
import { InternalAppmapError } from "../../error/index.mjs";
import { assert } from "../../util/index.mjs";
import { instrument } from "../../agent/index.mjs";
import { stringifyContent } from "./stringify.mjs";

let hooked = false;

export const unhook = (esm) => {
  if (esm) {
    assert(hooked, "esm not yet hooked", InternalAppmapError);
    hooks.load = loadDefault;
    hooks.transformSourceDefault = transformSourceDefault;
    hooked = false;
  }
};

export const hook = (agent, { hooks: { esm } }) => {
  if (esm) {
    assert(!hooked, "esm already hooked", InternalAppmapError);
    hooked = esm;
    const transformModule = (url, format, content) =>
      format === "module"
        ? instrument(agent, {
            url,
            type: "module",
            content: stringifyContent(content),
          })
        : content;
    hooks.load = async (url, context, nextAsync) => {
      const { format, source } = await nextAsync(url, context, nextAsync);
      return {
        format,
        source: transformModule(url, format, source),
      };
    };
    hooks.transformSource = async (content, context, nextAsync) => {
      const { format, url } = context;
      const { source } = await nextAsync(content, context, nextAsync);
      return {
        source: transformModule(url, format, source),
      };
    };
  }
  return esm;
};
