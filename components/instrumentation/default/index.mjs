import * as Astring from "astring";
import { logDebug } from "../../log/index.mjs";
import {
  createCodebase,
  getEnabledSourceFileArray,
  getMainFile,
  parseMain,
} from "./codebase.mjs";
import { visit } from "./visit.mjs";

export { extractMissingUrlArray } from "./codebase.mjs";

const { generate: generateEstree } = Astring;

export const instrument = (url, cache, configuration) => {
  const codebase = createCodebase(url, cache, configuration);
  const files = getEnabledSourceFileArray(codebase);
  if (files.length === 0) {
    logDebug("*Not* recording file %j", url);
    return {
      ...getMainFile(codebase),
      sources: [],
    };
  } else {
    logDebug("Recording file %j", url);
    return {
      url,
      content: generateEstree(
        visit(parseMain(codebase), {
          url,
          eval: configuration.hooks.eval,
          apply: configuration.hooks.apply,
          codebase,
        }),
      ),
      sources: files,
    };
  }
};
