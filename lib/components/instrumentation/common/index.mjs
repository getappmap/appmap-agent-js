import * as Escodegen from "escodegen";
import * as Acorn from "acorn";
import {
  getUniqueIdentifier,
  hasOwnProperty,
  makeIncrement,
  getRelativePath,
  expectSuccess,
  convertSpecifierToRegExp,
} from "../../../util/index.mjs";
import { visit } from "./visit.mjs";

import "./visit-program.mjs";
import "./visit-statement.mjs";
import "./visit-expression.mjs";
import "./visit-identifier.mjs";
import "./visit-pattern.mjs";
import "./visit-class.mjs";
import "./visit-closure.mjs";

const global_undefined = undefined;

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

export default (dependencies, configuration) => ({
  create: (options) => {
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
    const matchers = specifiers.map(convertSpecifierToMatcher);
    const increment = makeIncrement();
    const runtime = `${hidden}${getUniqueIdentifier()}`;
    return {
      runtime,
      instrument: (type, path, code) => {
        path = getRelativePath(basedir, path);
        const matcher = matchers.find(({ regexp }) => regexp.test(path));
        if (matcher === global_undefined) {
          return {
            entities: [],
            code,
          };
        }
        const { shallow, source, exclude } = matcher;
        const { node, entities } = visit(
          expectSuccess(
            () =>
              Acorn.parse(code, {
                sourceType: type,
                ecmaVersion: version,
                locations: true,
              }),
            "failed to parse file %j >> %e",
            path,
          ),
          {
            increment,
            runtime,
            path,
            shallow,
            exclude,
          },
          null,
        );
        return {
          entities: [
            {
              type: "package",
              name: path,
              source: source ? code : null,
              children: entities,
            },
          ],
          code: Escodegen.generate(node),
        };
      },
    };
  },
});
