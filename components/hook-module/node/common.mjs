import Module from "module";
import File from "./file.mjs";

const { apply } = Reflect;
const { prototype } = Module;
const { cwd } = process;

export default (dependencies) => {
  const {
    util: { assignProperty, mapMaybe, toAbsolutePath },
    frontend: { instrument, extractSourceMapURL },
    emitter: { sendEmitter },
  } = dependencies;
  const { readFile } = File(dependencies);
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
        const { content: content2, messages } = instrument(
          frontend,
          {
            url: `file://${toAbsolutePath(cwd(), path)}`,
            content: content1,
            type: "script",
          },
          mapMaybe(extractSourceMapURL(content1), readFile),
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
