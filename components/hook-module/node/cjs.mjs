import Module from "node:module";
import { convertPathToFileUrl } from "../../path/index.mjs";
import { readFile } from "../../file/index.mjs";
import { assignProperty } from "../../util/index.mjs";
import { instrument, extractMissingUrlArray } from "../../frontend/index.mjs";

const {
  Map,
  Reflect: { apply },
} = globalThis;

const { prototype } = Module;

export const unhook = (backup) => {
  backup.forEach(assignProperty);
};

export const hook = (frontend, { hooks: { cjs } }) => {
  if (!cjs) {
    return [];
  } else {
    const { _compile: original } = prototype;
    prototype._compile = function _compile(content, path) {
      const url = convertPathToFileUrl(path);
      const cache = new Map([[url, content]]);
      let complete = false;
      while (!complete) {
        const urls = extractMissingUrlArray(frontend, url, cache);
        if (urls.length === 0) {
          complete = true;
        } /* c8 ignore start */ else {
          for (const url of urls) {
            cache.set(url, readFile(url));
          }
        } /* c8 ignore start */
      }
      return apply(original, this, [instrument(frontend, url, cache), path]);
    };
    return [{ object: prototype, key: "_compile", value: original }];
  }
};
