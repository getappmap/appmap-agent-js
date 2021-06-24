import { generate as escodegen } from 'escodegen';
import { Left } from '../either.mjs';
import { RootLocation } from './location.mjs';
import { visit, getResultNode, getResultEntities } from './visit.mjs';

import './visit-class.mjs';
import './visit-closure.mjs';
import './visit-expression.mjs';
import './visit-identifier.mjs';
import './visit-pattern.mjs';
import './visit-program.mjs';
import './visit-statement.mjs';

export class Instrumenter {
  constructor (options) {
    this.options = {
      version: 2020,
      basedir: "/",
      exclude: [],
      source: false,
      shallow: false,
      ... options
    };
    this.packages = [];
    this.counters = {
      entity: 0,
      arrow: 0,
      function: 0,
      object: 0,
      class: 0
    };
  }
  instrument (type, path, content, options) {
    assert(Reflect.getOwnPropertyDescriptor(options, "basedir") === undefined, "cannot overwrite basedir option");
    options = {exclude:[], ...options};
    options = {
      ... this.options,
      ... options,
      list: null,
      exclude: [... this.options.exclude, ...options.excludes]
    };
    const {node, entities} = visit(expectSuccess(
      () => acorn.parse(content, {
        sourceType: type,
        ecmaVersion: options.version,
        locations: true
      }),
      "failed to parse file %o >> %s",
      path
    ), options);
    this.packages.push({
      type: "package",
      name: makeRelativePath(options.basedir, path),
      children: entities
    });
    return escodegen(node);
  }
  getPackages () {
    return this.packages;
  }
}
