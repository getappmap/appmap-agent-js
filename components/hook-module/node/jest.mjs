import {
  transformDefault,
  hook as hookJestTransformer,
} from "../../../lib/node/transformer-jest.mjs";
import { instrument } from "../../agent/index.mjs";
import { convertPathToFileUrl } from "../../path/index.mjs";

export const unhook = (_backup) => {
  hookJestTransformer.transform = transformDefault;
};

export const hook = (agent, { hooks: { esm, cjs } }) => {
  hookJestTransformer.transform = (
    source,
    path,
    { supportsStaticESM: is_module },
  ) => {
    if (is_module ? esm : cjs) {
      const url = convertPathToFileUrl(path);
      return {
        code: instrument(
          agent,
          /* c8 ignore start */
          { url, type: is_module ? "module" : "script", content: source.code },
          source.map === null ? null : { url, content: source.map },
          /* c8 ignore stop */
        ),
        map: null,
      };
    } else {
      return source;
    }
  };
  return null;
};
