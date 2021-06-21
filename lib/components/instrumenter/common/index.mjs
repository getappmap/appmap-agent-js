import { generate as escodegen } from 'escodegen';
import { Left } from '../either.mjs';
import { RootLocation } from './location.mjs';
import { visit, getResultNode, getResultEntities } from './visit.mjs';

import './visit-class.mjs';
import './visit-closure.mjs';
import './visit-expression.mjs';
import { Collision } from './visit-identifier.mjs';
import './visit-pattern.mjs';
import './visit-program.mjs';
import './visit-statement.mjs';

class Instrumenter {
  constructor (options) {
    this.options = {
      version: 2020,
      basedir: "/",
      exclude: [],
      source: false,
      shallow: false,
      ... options
    };
    this.entities = [];
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
      excludes: [... this.options.exclude, ...options.excludes]
    };
    const {node, entities} = visit(expectSuccess(
      () => acorn.parse(content, {
        sourceType: type,
        ecmaVersion: options.ecma_version,
        locations: true
      }),
      "failed to parse file %o >> %s",
      path
    ), new RootLocation(file, this.counters, options));
    const names = makeRelativePath(options.basedir, path).split("/");
    const filename = names.pop();
    let children = this.entities;
    for (let name of names) {
      let child = children.find((child) => child.name === name);
      if (child === undefined || child.type !== "package") {
        child = {
          type: "package",
          name,
          children: []
        };
        children.push(child);
      }
      children = child.children;
    }
    children.push({
      type: "class",
      name: filename,
      children: entities
    });
    return escodegen(node);
  }
  getClassMap () {
    return this.entities;
  }
}

export const instrument = (options) => {
  options = {
    type: null,
    path: null,
    content: null,
    origin: null,
    "ecma-version": 2020,
    exclude: [],
    source: false,
    shallow: false,
    ...options
  };
  try {
    const location = new RootLocation(options);
    return location
      .getFile()
      .parse()
      .mapRight((node) => {
        const result = visit(node, location);
        return {
          content: escodegen(getResultNode(result)),
          entities: getResultEntities(result),
        };
      });
    // c8 vs node12
    /* c8 ignore start */
  } catch (error) {
    /* c8 ignore stop */
    if (error instanceof Collision) {
      return new Left(error.getMessage());
    }
    /* c8 ignore start */ throw error;
  } /* c8 ignore stop */
};
