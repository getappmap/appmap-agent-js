import { generate } from "escodegen";
import { parse } from "acorn";

import Visit from "./visit.mjs";

const _String = String;

export default (dependencies) => {
  const {
    util: { createCounter, incrementCounter },
    specifier: { matchSpecifier },
    uuid: { getUUID },
    expect: { expectSuccess },
    naming: { createExclusion },
  } = dependencies;
  const { visit } = Visit(dependencies);
  return {
    createInstrumentation: ({
      language: { version },
      "hidden-identifier": identifier,
      exclude,
      packages,
      source,
    }) => ({
      runtime: `${identifier}${getUUID()}`,
      version,
      exclude,
      packages,
      source,
      naming: createCounter(0),
      indexing: createCounter(-1),
      uuid: getUUID(),
    }),
    getInstrumentationIdentifier: ({ runtime }) => runtime,
    instrument: (instrumentation, type, path, code) => {
      const {
        runtime,
        naming,
        indexing,
        packages,
        version,
        source: global_source,
        exclude: exclude1,
      } = instrumentation;
      for (let [specifier, data] of packages) {
        if (matchSpecifier(specifier, path)) {
          const { enabled, shallow, exclude: exclude2, source } = data;
          if (!enabled) {
            break;
          }
          const index = incrementCounter(indexing);
          const exclude = [...exclude1, ...exclude2];
          return {
            file: {
              index,
              exclude,
              shallow,
              type,
              path,
              code,
              source:
                /* c8 ignore start */ source === null
                  ? global_source
                  : source /* c8 ignore stop */,
            },
            code: generate(
              visit(
                expectSuccess(
                  () =>
                    parse(code, {
                      allowHashBang: true,
                      sourceType: type,
                      ecmaVersion: version,
                    }),
                  "failed to parse file %j >> %e",
                  path,
                ),
                _String(index),
                null,
                {
                  path,
                  naming,
                  runtime,
                  exclusion: createExclusion(exclude),
                },
              ),
            ),
          };
        }
      }
      return { code, file: null };
    },
  };
};
