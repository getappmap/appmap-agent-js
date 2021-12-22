import Module from "module";
import { pathToFileURL } from "url";

const { apply } = Reflect;
const { prototype } = Module;
const { cwd } = process;

export default (dependencies) => {
  const {
    util: { assignProperty },
    path: { toAbsolutePath },
    frontend: { instrument },
    emitter: { sendEmitter },
    "source-outer": { extractSourceMap },
  } = dependencies;
  return {
    unhookCommonModule: (backup) => {
      backup.forEach(assignProperty);
    },
    hookCommonModule: (
      emitter,
      frontend,
      { hooks: { cjs }, repository: { directory } },
    ) => {
      if (!cjs) {
        return [];
      }
      const { _compile: original } = prototype;
      prototype._compile = function _compile(content1, path) {
        const file = {
          url: pathToFileURL(toAbsolutePath(cwd(), path)).toString(),
          content: content1,
          type: "script",
        };
        const { content: content2, messages } = instrument(
          frontend,
          file,
          extractSourceMap(file),
        );
        for (const message of messages) {
          sendEmitter(emitter, message);
        }
        return apply(original, this, [content2, path]);
      };
      return [{ object: prototype, key: "_compile", value: original }];
    },
  };
};
