import { generate as generateEstree } from "escodegen";
import { parse as parseEstree } from "acorn";

import Visit from "./visit.mjs";

const _Set = Set;

export default (dependencies) => {
  const {
    log: { logDebug },
    util: { generateGet },
    "configuration-helper": { getConfigurationPackage },
    uuid: { getUUID },
    expect: { expectSuccess },
    source: { getSources },
  } = dependencies;
  const { visit } = Visit(dependencies);
  const getHead = generateGet("head");
  const getBody = generateGet("body");
  const getURL = generateGet("url");
  return {
    createInstrumentation: ({
      language: { version },
      "hidden-identifier": identifier,
      exclude: default_exclude,
      packages,
      "inline-source": default_inline,
    }) => ({
      version,
      packages,
      default_exclude,
      default_inline,
      runtime: `${identifier}${getUUID()}`,
      done: new _Set(),
    }),
    getInstrumentationIdentifier: ({ runtime }) => runtime,
    instrument: (
      {
        version,
        packages,
        default_exclude,
        default_inline,
        runtime,
        counter,
        done,
      },
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
          } = getConfigurationPackage(packages, url);
          return {
            head: enabled,
            body: {
              url,
              content,
              shallow,
              /* c8 ignore start */
              inline: inline === null ? default_inline : inline,
              /* c8 ignore stop */
              exclude: [...default_exclude, ...exclude],
            },
          };
        })
        .filter(getHead)
        .map(getBody);
      if (sources.length === 0) {
        logDebug("Not instrumenting %j", url);
        return { url, content, sources: [] };
      }
      logDebug("Instrumenting %j", url);
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
                  ecmaVersion: version,
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
