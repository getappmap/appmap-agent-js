import Module from "module";

import { convertPathToFileUrl } from "../../path/index.mjs";
import { assignProperty } from "../../util/index.mjs";
import { instrument } from "../../agent/index.mjs";

const {
  Reflect: { apply },
} = globalThis;

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
      instrument(
        agent,
        {
          url: convertPathToFileUrl(path),
          content: content1,
          type: "script",
        },
        null,
      ),
      path,
    ]);
  };
  return [{ object: prototype, key: "_compile", value: original }];
};
