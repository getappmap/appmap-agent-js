import * as Astring from "astring";
import { logDebug } from "../../log/index.mjs";
import { getMappingSourceArray } from "../../mapping/index.mjs";
import {
  parseSource,
  getSourceUrl,
  getSourceContent,
} from "../../source/index.mjs";
import { createExclusion, addExclusionSource } from "./exclusion.mjs";
import { visit } from "./visit.mjs";

const { generate: generateEstree } = Astring;

export const createInstrumentation = (configuration) => ({
  configuration,
});

export const instrument = ({ configuration }, source, mapping) => {
  const url = getSourceUrl(source);
  const content = getSourceContent(source);
  const sources = getMappingSourceArray(mapping);
  const exclusion = createExclusion(
    configuration,
    sources.length === 1 && sources[0] === source,
  );
  const included_source_array = sources.filter((source) =>
    addExclusionSource(exclusion, source),
  );
  if (included_source_array.length === 0) {
    logDebug(
      "Not instrumenting file %j because it has no allowed sources",
      url,
    );
    return { url, content, sources: [] };
  } else {
    if (
      configuration.hooks.eval.aliases.length === 0 &&
      configuration.hooks.apply === null
    ) {
      logDebug(
        "Not instrumenting file %j because instrumentation hooks (apply and eval) are disabled",
        url,
      );
      return { url, content, sources: included_source_array };
    } else {
      logDebug("Instrumenting file %j", url);
      return {
        url,
        content: generateEstree(
          visit(parseSource(source), {
            url,
            exclusion,
            eval: configuration.hooks.eval,
            apply: configuration.hooks.apply,
            mapping,
          }),
        ),
        sources: included_source_array,
      };
    }
  }
};
