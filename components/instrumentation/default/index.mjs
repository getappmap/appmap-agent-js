/* globals URL */

import { generate } from "escodegen";
import { parse } from "acorn";

import Visit from "./visit.mjs";
import Source from "./source.mjs";

const _Set = Set;

export default (dependencies) => {
  const {
    util: { generateGet },
    configuration: { getConfigurationPackage },
    uuid: { getUUID },
    expect: { expectSuccess },
  } = dependencies;
  const { visit } = Visit(dependencies);
  const {
    createSourceMap,
    createMirrorSourceMap,
    extractSourceMapURL,
    getSources,
  } = Source(dependencies);
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
    extractInstrumentationSourceMapURL: extractSourceMapURL,
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
      script_file,
      source_map_file,
    ) => {
      /* c8 ignore start */
      const mapping =
        source_map_file === null
          ? createSourceMap(source_map_file)
          : createMirrorSourceMap(script_file);
      /* c8 ignore stop */
      let sources = getSources(mapping);
      sources = sources
        .map(({ url, content }) => {
          const { pathname: path } = new URL(url);
          const {
            enabled,
            shallow,
            exclude,
            "inline-source": inline,
          } = getConfigurationPackage(packages, path);
          return {
            head: enabled,
            body: {
              url,
              content,
              shallow,
              /* c8 ignore start */
              "inline-source": inline === null ? default_inline : inline,
              /* c8 ignore stop */
              exclude: [...default_exclude, ...exclude],
            },
          };
        })
        .filter(getHead)
        .map(getBody);
      const { type, url, content } = script_file;
      if (sources.length === 0) {
        return { url, content, sources: [] };
      }
      sources = sources.filter(({ url }) => !done.has(url));
      for (const { url } of sources) {
        done.add(url);
      }
      return {
        url,
        content: generate(
          visit(
            expectSuccess(
              () =>
                parse(content, {
                  allowHashBang: true,
                  sourceType: type,
                  ecmaVersion: version,
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
