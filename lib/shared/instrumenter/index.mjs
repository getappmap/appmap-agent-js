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

const isNotDot = (string) => string !== ".";

const getParts = (path) => {
  expect(path[0] === "/", "expected an absolute path but got: %o", path);
  const stack = [];
  for (const part of path.split("/")) {
    if (part === "..") {
      stack.pop();
    } else if (part !== "." && part !== "") {
      stack.push(part);
    }
  }
  return stack;
}

const relative = (path1, path2) => {
  const parts1 = getParts(path1);
  const parts2 = getParts(path2);
  let index = 0;
  while (index < parts1.length && index < parts2.length && parts1[index] === parts2[index]) {
    index += 1;
  }
  if (index >= parts1.length) {
    return parts2.slice(parts1.length);
  }
  if (index >= parts2.length) {

  }
}

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
    this.counter = 0;
    this.counters = {
      arrow: 0,
      function: 0,
      object: 0,
      class: 0
    };
    this.origins = new Map();
  }
  instrument (type, path, content, options) {
    options = {exclude:[], ...options};
    options = {
      ... this.options,
      ... options,
      excludes: [... this.options.exclude, ...options.excludes]
    };
    const node = expectSuccess(
      () => acorn.parse(content, {
        sourceType: type,
        ecmaVersion: options.ecma_version,
        locations: true
      },
      "failed to parse file %o >> %s",
      path
    );
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
  }
  getClassMap () {

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
