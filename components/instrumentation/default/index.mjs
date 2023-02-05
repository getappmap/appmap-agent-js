import * as Astring from "astring";
import * as Acorn from "acorn";
import { logError, logDebug } from "../../log/index.mjs";
import { ExternalAppmapError } from "../../error/index.mjs";
import { getMappingSourceArray } from "../../mapping/index.mjs";
import { createExclusion, addExclusionSource } from "./exclusion.mjs";
import { visit } from "./visit.mjs";

const { generate: generateEstree } = Astring;
const { parse: parseAcorn } = Acorn;

export const createInstrumentation = (configuration) => ({
  configuration,
});

const parseEstree = (type, content, url) => {
  try {
    return parseAcorn(content, {
      allowHashBang: true,
      sourceType: type,
      allowAwaitOutsideFunction: type === "module",
      ecmaVersion: "latest",
      locations: true,
    });
  } catch (error) {
    logError("Failed to parse file %j as %s >> %O", url, type, error);
    throw new ExternalAppmapError("Failed to parse js file");
  }
};

export const instrument = (
  { configuration },
  { url, type, content },
  mapping,
) => {
  const exclusion = createExclusion(configuration);
  const sources = getMappingSourceArray(mapping).filter((source) =>
    addExclusionSource(exclusion, source),
  );
  if (sources.length === 0) {
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
      return { url, content, sources };
    } else {
      logDebug("Instrumenting file %j", url);
      return {
        url,
        content: generateEstree(
          visit(parseEstree(type, content, url), {
            url,
            exclusion,
            eval: configuration.hooks.eval,
            apply: configuration.hooks.apply,
            mapping,
          }),
        ),
        sources,
      };
    }
  }
};
