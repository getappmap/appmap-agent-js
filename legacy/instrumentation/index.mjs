import { generate } from "escodegen";
import { parse } from "acorn";

import Visit from "./visit.mjs";

const _Set = Set;

export default (dependencies) => {
  const {
    util: { createCounter, createBox, setBox, getBox },
    specifier: { matchSpecifier },
    uuid: { getUUID },
    assert: { assertSuccess },
  } = dependencies;

  const { visit } = Visit(dependencies);
  const getRuntime = ({ uuid, conf }) => {
    const { identifier } = getBox(conf);
    return `${identifier}${uuid}`;
  };
  return {
    createInstrumentation: () => ({
      conf: createBox(null),
      counter: createCounter(0),
      uuid: getUUID(),
    }),
    configureInstrumentation: (
      { conf },
      {
        language: { version },
        "hidden-identifier": identifier,
        "include-source": source,
        exclude,
        packages,
      },
    ) => {
      setBox(conf, {
        identifier,
        version,
        source,
        exclude,
        packages,
      });
    },
    getInstrumentationIdentifier: getRuntime,
    instrument: (instrumentation, kind, path, code) => {
      const { counter, conf } = instrumentation;
      const runtime = getRuntime(instrumentation);
      const {
        packages,
        version,
        source: source1,
        exclude: exclude1,
      } = getBox(conf);
      for (let [specifier, data] of packages) {
        if (matchSpecifier(specifier, path)) {
          const { enabled, shallow, source: source2, exclude: exclude2 } = data;
          if (!enabled) {
            break;
          }
          const { node, entities } = visit(
            assertSuccess(
              () =>
                parse(code, {
                  sourceType: kind,
                  ecmaVersion: version,
                  locations: true,
                }),
              "failed to parse file %j >> %e",
              path,
            ),
            {
              counter,
              runtime,
              path,
              shallow,
              exclude: new _Set([...exclude1, ...exclude2]),
            },
            null,
          );
          return {
            module: {
              kind,
              path,
              code: (source2 === null ? source1 : source2) ? code : null,
              children: entities,
            },
            code: generate(node),
          };
        }
      }
      return {
        module: null,
        code,
      };
    },
  };
};
