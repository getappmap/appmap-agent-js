import { generate } from "escodegen";
import { parse } from "acorn";

import Visit from "./visit.mjs";

const _String = String;

export default (dependencies) => {
  const {
    util: { createCounter, incrementCounter, toAbsolutePath, getDirectory },
    configuration: { getConfigurationPackage },
    uuid: { getUUID },
    expect: { expectSuccess },
    naming: { createExclusion },
    "source-map": { loadSourceMap },
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
      const {
        enabled,
        shallow,
        exclude: exclude2,
        source,
      } = getConfigurationPackage(packages, path);
      if (!enabled) {
        return { file: null, code };
      }
      const index = incrementCounter(indexing);
      const exclude = [...exclude1, ...exclude2];
      let source_map_url = null;
      {
        const parts = /\/\/# sourceMappingURL=(.*)$/u.exec(code);
        if (parts !== null) {
          source_map_url = parts[1];
          if (!/^[a-z]+:\/\//u.test(source_map_url)) {
            if (!source_map_url.startsWith("/")) {
              source_map_url = toAbsolutePath(
                getDirectory(path),
                source_map_url,
              );
            }
            source_map_url = `file://${source_map_url}`;
          }
        }
      }
      return {
        file: {
          index,
          exclude,
          shallow,
          type,
          path,
          code,
          source_map_url,
          source_map: loadSourceMap(source_map_url),
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
    },
  };
};
