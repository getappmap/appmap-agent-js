import { generate } from "escodegen";
import { parse } from "acorn";

import Visit from "./visit.mjs";

const _String = String;
const _Set = Set;

const nameable = new _Set([
  "ObjectExpression",
  "ClassExpression",
  "ClassDeclaration",
  "FunctionExpression",
  "FunctionDeclaration",
  "ArrowFunctionExpression",
]);

export default (dependencies) => {
  const {
    util: { createCounter, incrementCounter, createBox, setBox, getBox },
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
      naming: createCounter(0),
      indexing: createCounter(-1),
      uuid: getUUID(),
    }),
    configureInstrumentation: (
      { conf },
      {
        language: { version },
        "hidden-identifier": identifier,
        exclude,
        packages,
      },
    ) => {
      setBox(conf, {
        identifier,
        version,
        exclude,
        packages,
      });
    },
    getInstrumentationIdentifier: getRuntime,
    instrument: (instrumentation, type, path, code) => {
      const { naming, indexing, conf } = instrumentation;
      const runtime = getRuntime(instrumentation);
      const { packages, version, exclude: exclude1 } = getBox(conf);
      for (let [specifier, data] of packages) {
        if (matchSpecifier(specifier, path)) {
          const { enabled, shallow, exclude: exclude2 } = data;
          if (!enabled) {
            break;
          }
          const index = incrementCounter(indexing);
          return {
            file: { index, type, path, code },
            code: generate(
              visit(
                assertSuccess(
                  () =>
                    parse(code, {
                      sourceType: type,
                      ecmaVersion: version
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
                  shallow,
                  exclude: new _Set([...exclude1, ...exclude2]),
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
