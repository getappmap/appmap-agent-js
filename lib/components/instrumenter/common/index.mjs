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

export class Instrumenter {
  constructor(options) {
    this.options = {
      version: 2020,
      runtime: "APPMAP",
      exclude: [],
      source: false,
      shallow: false,
      ...options,
    };
    this.counter = new Counter();
    this.packages = [];
  }
  instrument(type, path, content, options) {
    options = { exclude: [], ...options };
    options = {
      ...this.options,
      ...options,
      exclude: [...this.options.exclude, ...options.exclude],
    };
    const { node, entities } = visit(
      expectSuccess(
        () =>
          Acorn.parse(content, {
            sourceType: type,
            ecmaVersion: options.version,
            locations: true,
          }),
        "failed to parse file %o >> %s",
        path,
      ),
      {
        path,
        counter: this.counter,
        shallow: options.shallow,
        exclude: new Set(options.exclude),
        runtime: options.runtime,
      },
    );
    this.packages.push({
      type: "package",
      name: path,
      source: options.source ? content : null,
      children: entities,
    });
    return Escodegen.generate(node);
  }
  getPackages() {
    return this.packages;
  }
}
