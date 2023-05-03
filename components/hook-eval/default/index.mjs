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
import { assert, toString } from "../../util/index.mjs";
import { instrument } from "../../frontend/index.mjs";

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
        (url, position, content) =>
          instrument(
            frontend,
            toAbsoluteUrl(`eval-${position}.js`, toDirectoryUrl(url)),
            toString(content),
            readFile,
          ),
        true,
      ),
      "global eval hook variable already defined",
      InternalAppmapError,
    );
  }
  return enabled ? hidden : null;
};
