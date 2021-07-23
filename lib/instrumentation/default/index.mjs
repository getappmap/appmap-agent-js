import * as Escodegen from "escodegen";
import * as Acorn from "acorn";

import Visit from "./visit.mjs";

const global_undefined = undefined;

export default (dependencies) => {
  const {
    util: {
      hasOwnProperty,
      createCounter,
      getRelativePath,
      convertSpecifierToRegExp,
    },
    uuid: { getUUID },
    expect: { expectSuccess },
  } = dependencies;

  const { visit } = Visit(dependencies);

  const convertSpecifierToMatcher = (specifier) => {
    const { shallow, source, exclude } = {
      shallow: hasOwnProperty(specifier, "dist"),
      source: false,
      exclude: [],
      ...specifier,
    };
    return {
      regexp: convertSpecifierToRegExp(specifier),
      shallow,
      source,
      exclude: new Set(exclude),
    };
  };

  return {
    createInstrumentation: (options) => {
      const {
        version,
        hidden,
        basedir,
        packages: specifiers,
      } = {
        version: 2020,
        hidden: "APPMAP",
        basedir: ".",
        packages: [],
        ...options,
      };
      return {
        version,
        basedir,
        matchers: specifiers.map(convertSpecifierToMatcher),
        counter: createCounter(),
        runtime: `${hidden}${getUUID()}`,
      };
    },
    getInstrumentationIdentifier: ({ runtime }) => runtime,
    instrument: (
      { basedir, matchers, version, counter, runtime },
      kind,
      path,
      code,
    ) => {
      path = getRelativePath(basedir, path);
      const matcher = matchers.find(({ regexp }) => regexp.test(path));
      if (matcher === global_undefined) {
        return {
          module: null,
          code,
        };
      }
      const { shallow, source, exclude } = matcher;
      const { node, entities } = visit(
        expectSuccess(
          () =>
            Acorn.parse(code, {
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
        code: Escodegen.generate(node),
      };
    },
  };
};
