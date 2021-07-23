import { generate } from "escodegen";
import { parse } from "acorn";

import Visit from "./visit.mjs";

export default (dependencies) => {
  const {
    util: { createCounter },
    config: { matchSpecifier },
    uuid: { getUUID },
    expect: { expectSuccess },
  } = dependencies;

  const { visit } = Visit(dependencies);

  return {
    createInstrumentation: ({
      "ecma-version": version,
      "hidden-identifier": identifier,
      packages,
    }) => ({
      version,
      packages,
      counter: createCounter(),
      runtime: `${identifier}${getUUID()}`,
    }),
    getInstrumentationIdentifier: ({ runtime }) => runtime,
    instrument: ({ packages, version, counter, runtime }, kind, path, code) => {
      for (let [specifier, data] of packages) {
        if (matchSpecifier(specifier, path)) {
          const { shallow, source, exclude } = data;
          const { node, entities } = visit(
            expectSuccess(
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
              exclude,
            },
            null,
          );
          return {
            module: {
              kind,
              path,
              code: source ? code : null,
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
