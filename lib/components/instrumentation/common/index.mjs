import * as Escodegen from "escodegen";
import * as Acorn from "acorn";
import { Counter, expectSuccess } from "../../../util/index.mjs";
import { visit } from "./visit.mjs";

import "./visit-program.mjs";
import "./visit-statement.mjs";
import "./visit-expression.mjs";
import "./visit-identifier.mjs";
import "./visit-pattern.mjs";
import "./visit-class.mjs";
import "./visit-closure.mjs";

export default (dependencies, options) => (options) => {
  const increment = makeIncrement();
  const {runtime, version, ... default_options} = {
    version: 2020,
    runtime: "APPMAP",
    exclude: [],
    source: false,
    shallow: false,
    ...options,
  };
  const hidden = `${options.runtime}${getUniqueIdentifier()}`;
  return {
    hidden,
    instrument: (type, path, content, options) => {
      options = { exclude: [], ...options };
      options = {
        ... default_options,
        ... options,
        exclude: [...default_options.exclude, ...options.exclude],
      };
      const { node, entities } = visit(
        expectSuccess(
          () =>
            Acorn.parse(content, {
              sourceType: type,
              ecmaVersion: this.version,
              locations: true,
            }),
          "failed to parse file %o >> %s",
          path,
        ),
        {
          path,
          increment,
          shallow: options.shallow,
          exclude: new Set(options.exclude),
          runtime: this.runtime,
        },
      );
      return {
        entity: {
          type: "package",
          name: path,
          source: options.source ? content : null,
          children: entities,
        },
        code: Escodegen.generate(node),
      };
    }
  };
};
