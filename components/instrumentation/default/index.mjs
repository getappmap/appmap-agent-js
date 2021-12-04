import Escodegen from "escodegen";
import * as Acorn from "acorn";

const { generate: generateEstree } = Escodegen;
const { parse: parseEstree } = Acorn;

import Visit from "./visit.mjs";

const _Set = Set;

export default (dependencies) => {
  const {
    log: { logInfo },
    util: { generateGet },
    "configuration-accessor": { getConfigurationPackage },
    uuid: { getUUID },
    expect: { expectSuccess },
    source: { getSources },
  } = dependencies;
  const { visit } = Visit(dependencies);
  const getHead = generateGet("head");
  const getBody = generateGet("body");
  const getURL = generateGet("url");
  return {
    createInstrumentation: (configuration) => ({
      configuration,
      runtime: `${configuration["hidden-identifier"]}${getUUID()}`,
      done: new _Set(),
    }),
    getInstrumentationIdentifier: ({ runtime }) => runtime,
    instrument: (
      { configuration, runtime, done },
      { type, url, content },
      mapping,
    ) => {
      let sources = getSources(mapping);
      sources = sources
        .map(({ url, content }) => {
          const {
            enabled,
            shallow,
            exclude,
            "inline-source": inline,
          } = getConfigurationPackage(configuration, url);
          return {
            head: enabled,
            body: {
              url,
              content,
              shallow,
              /* c8 ignore start */
              inline: inline === null ? configuration["inline-source"] : inline,
              /* c8 ignore stop */
              exclude: [...exclude, ...configuration.exclude],
            },
          };
        })
        .filter(getHead)
        .map(getBody);
      if (sources.length === 0) {
        logInfo("Not instrumenting %j", url);
        return { url, content, sources: [] };
      }
      logInfo("Instrumenting %j", url);
      sources = sources.filter(({ url }) => !done.has(url));
      for (const { url } of sources) {
        done.add(url);
      }
      return {
        url,
        content: generateEstree(
          visit(
            expectSuccess(
              () =>
                parseEstree(content, {
                  allowHashBang: true,
                  sourceType: type,
                  ecmaVersion: configuration.language.version,
                  locations: true,
                }),
              "failed to parse file %j >> %e",
              url,
            ),
            {
              url,
              runtime,
              whitelist: new _Set(sources.map(getURL)),
              mapping,
            },
          ),
        ),
        sources,
      };
    },
  };
};
