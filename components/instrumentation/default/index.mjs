import * as Astring from "astring";
import { parseEstree } from "../../parse/index.mjs";
import { logDebug } from "../../log/index.mjs";
import { getMappingSourceArray } from "../../mapping/index.mjs";
import { createExclusion, addExclusionSource } from "./exclusion.mjs";
import { visit } from "./visit.mjs";

const { generate: generateEstree } = Astring;

const toSourceMessage = ({ url, content }) => ({
  type: "source",
  url,
  content,
});

export const instrument = (configuration, { url, content }, mapping) => {
  const sources = getMappingSourceArray(mapping);
  const exclusion = createExclusion(
    configuration,
    sources.length === 1 &&
      sources[0].content === content &&
      sources[0].url === url,
  );
  const included_source_array = sources.filter((source) =>
    addExclusionSource(exclusion, source),
  );
  if (included_source_array.length === 0) {
    logDebug(
      "Not instrumenting file %j because it has no allowed sources",
      url,
    );
    return { url, content, messages: [] };
  } else {
    if (
      configuration.hooks.eval.aliases.length === 0 &&
      configuration.hooks.apply === null
    ) {
      logDebug(
        "Not instrumenting file %j because instrumentation hooks (apply and eval) are disabled",
        url,
      );
      return {
        url,
        content,
        messages: included_source_array.map(toSourceMessage),
      };
    } else {
      logDebug("Instrumenting file %j", url);
      return {
        url,
        content: generateEstree(
          visit(parseEstree({ url, content }), {
            url,
            exclusion,
            eval: configuration.hooks.eval,
            apply: configuration.hooks.apply,
            mapping,
          }),
        ),
        messages: included_source_array.map(toSourceMessage),
      };
    }
  }
};
