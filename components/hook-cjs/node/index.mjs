const {
  URL,
  Reflect: { apply },
} = globalThis;

const { search: __search } = new URL(import.meta.url);

import Module from "module";
import { pathToFileURL } from "url";
const { assignProperty } = await import(`../../util/index.mjs${__search}`);
const { instrument } = await import(`../../agent/index.mjs${__search}`);

const { prototype } = Module;

export const unhook = (backup) => {
  backup.forEach(assignProperty);
};

export const hook = (agent, { hooks: { cjs } }) => {
  if (!cjs) {
    return [];
  }
  const { _compile: original } = prototype;
  prototype._compile = function _compile(content1, path) {
    return apply(original, this, [
      instrument(agent, {
        url: pathToFileURL(path).toString(),
        content: content1,
        type: "script",
      }),
      path,
    ]);
  };
  return [{ object: prototype, key: "_compile", value: original }];
};
