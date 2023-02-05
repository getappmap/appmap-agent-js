import * as Astring from "astring";
import * as Acorn from "acorn";
import { logError, logDebug } from "../../log/index.mjs";
import { generateGet } from "../../util/index.mjs";
import { ExternalAppmapError } from "../../error/index.mjs";
import { getSources } from "../../source-map/index.mjs";
import { lookupSpecifier } from "../../specifier/index.mjs";
import { visit } from "./visit.mjs";

const { Set } = globalThis;

const { generate: generateEstree } = Astring;
const { parse: parseAcorn } = Acorn;

const getHead = generateGet("head");
const getBody = generateGet("body");
const getUrl = generateGet("url");

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
  const sources = getSources(mapping)
    .map(({ url, content }) => {
      const { enabled } = lookupSpecifier(
        configuration.packages,
        url,
        configuration["default-package"],
      );
      logDebug(
        "%s source file %j",
        enabled ? "Instrumenting" : "Not instrumenting",
        url,
      );
      return {
        head: enabled,
        body: {
          url,
          content,
        },
      };
    })
    .filter(getHead)
    .map(getBody);
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
            whitelist: new Set(sources.map(getUrl)),
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
