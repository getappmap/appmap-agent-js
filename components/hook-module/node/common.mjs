import Module from "module";
import { pathToFileURL } from "url";

const { apply } = Reflect;
const { prototype } = Module;

export default (dependencies) => {
  const {
    util: { assignProperty },
    agent: { instrument },
  } = dependencies;
  return {
    unhook: (backup) => {
      backup.forEach(assignProperty);
    },
    hook: (agent, { hooks: { cjs }, repository: { directory } }) => {
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
    },
  };
};
