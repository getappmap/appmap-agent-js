import * as Astring from "astring";
import * as Acorn from "acorn";
import { logError, logDebug } from "../../log/index.mjs";
import { generateGet, recoverMaybe } from "../../util/index.mjs";
import { ExternalAppmapError } from "../../error/index.mjs";
import { getSources } from "../../source/index.mjs";
import { lookupSpecifier } from "../../specifier/index.mjs";
import { visit } from "./visit.mjs";

const { Set } = globalThis;

const { generate: generateEstree } = Astring;
const { parse: parseAcorn } = Acorn;

const getHead = generateGet("head");
const getBody = generateGet("body");
const getURL = generateGet("url");

export const createInstrumentation = (configuration) => ({
  configuration,
  done: new Set(),
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
  { configuration, done },
  { url, type, content },
  mapping,
) => {
  const sources = getSources(mapping)
    .map(({ url, content }) => {
      const {
        enabled,
        shallow,
        exclude,
        "inline-source": inline,
      } = lookupSpecifier(configuration, url);
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
          shallow,
          inline: recoverMaybe(inline, configuration["inline-source"]),
          exclude: [...exclude, ...configuration.exclude],
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
    const new_sources = sources.filter(({ url }) => !done.has(url));
    for (const { url } of new_sources) {
      done.add(url);
    }
    if (
      configuration.hooks.eval.aliases.length === 0 &&
      configuration.hooks.apply === null
    ) {
      logDebug(
        "Not instrumenting file %j because instrumentation hooks (apply and eval) are disabled",
        url,
      );
      return { url, content, sources: new_sources };
    } else {
      logDebug("Instrumenting file %j", url);
      return {
        url,
        content: generateEstree(
          visit(parseEstree(type, content, url), {
            url,
            whitelist: new Set(sources.map(getURL)),
            eval: configuration.hooks.eval,
            apply: configuration.hooks.apply,
            mapping,
          }),
        ),
        sources: new_sources,
      };
    }
  }
};
