import Module from "node:module";
import { convertPathToFileUrl } from "../../path/index.mjs";
import { readFile } from "../../file/index.mjs";
import { assignProperty, toString } from "../../util/index.mjs";
import { instrument } from "../../frontend/index.mjs";

const {
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
      return apply(original, this, [
        instrument(
          frontend,
          convertPathToFileUrl(toString(path)),
          content,
          readFile,
        ),
        path,
      ]);
    };
    return [{ object: prototype, key: "_compile", value: original }];
  }
};
