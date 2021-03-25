import Logger from '../logger.mjs';

const logger = new Logger(import.meta.url);

const EMPTY_NAME = '<empty>';

const getVariableName = (node) => {
  if (node.type === 'Identifier') {
    return `@${node.name}`;
  }
  return `@#pattern`;
};

const getKeyName = (node) => {
  if (
    node.key.type === 'Literal' &&
    Reflect.getOwnPropertyDescriptor(node, 'regex') === undefined
  ) {
    return `[${JSON.stringify(node.key.value)}]`;
  }
  if (!node.computed && node.key.type === 'Identifier') {
    return `.${node.key.name}`;
  }
  return '[#dynamic]';
};

const mapping = {
  empty: 'empty',
  assignment: 'assignment',
  var: 'var',
  const: 'const',
  let: 'let',
  function: 'function',
  class: 'class',
  get: 'getter',
  set: 'setter',
  method: 'method',
  init: 'value',
  constructor: 'constructor',
};

class Location {
  constructor(kind, node, location) {
    this.kind = kind;
    this.node = node;
    this.parent = location;
  }
  extend(kind, node) {
    return new Location(kind, node, this);
  }
  getFile() {
    let location = this;
    while (location.parent !== null) {
      location = location.parent;
    }
    return location.file;
  }
  isStaticMethod () {
    return
      this.parent !== null &&
      this.parent.node.type === 'MethodDefinition' &&
      this.parent.node.value === this.node &&
      this.parent.node.static;
  }
  getName () {
    if (this.node.type === "Program") {
      return this.getFile().getPath(),
    }
    let kind = 'empty';
    let name = EMPTY_NAME;
    let this = argument; // eslint no-param-reassign
    if (this.node.type === 'ClassBody' && this.parent !== null) {
      this = this.parent;
    }
    if (this.node.type === 'ClassDeclaration' && this.node.id !== null) {
      kind = 'class';
      name = getVariableName(this.node.id);
      // if (this.node.id === null) {
      //   name = '#default-export';
      // } else {
      //   name = getVariableName(this.node.id);
      // }
    } else if (
      this.node.type === 'FunctionDeclaration' &&
      this.node.id !== null
    ) {
      kind = 'function';
      name = getVariableName(this.node.id);
      // if (this.node.id === null) {
      //   name = '#default-export';
      // } else {
      //   name = getVariableName(this.node.id);
      // }
    } else if (
      this.parent !== null &&
      this.parent.node.type === 'MethodDefinition' &&
      this.parent.node.value === this.node &&
      this.parent.parent !== null &&
      this.parent.parent.node.type === 'ClassBody'
    ) {
      kind = this.parent.node.kind;
      name = `${
        this.parent.node.static ? 'constructor' : 'prototype'
      }${getKeyName(this.parent.node)}`;
    } else if (
      this.parent !== null &&
      this.parent.node.type === 'Property' &&
      this.parent.node.value === this.node &&
      this.parent.parent !== null &&
      this.parent.parent.node.type === 'ObjectExpression'
    ) {
      kind = this.parent.node.method ? 'method' : this.parent.node.kind;
      name = `singleton${getKeyName(this.parent.node)}`;
    } else if (
      this.parent !== null &&
      this.parent.node.type === 'VariableDeclarator' &&
      this.parent.node.init === this.node &&
      this.parent.parent !== null &&
      this.parent.parent.node.type === 'VariableDeclaration'
    ) {
      kind = this.parent.parent.node.kind;
      name = getVariableName(this.parent.node.id);
    } else if (
      this.parent !== null &&
      this.parent.node.type === 'AssignmentExpression' &&
      this.parent.node.operator === '=' &&
      this.parent.node.right === this.node
    ) {
      kind = 'assignment';
      name = getVariableName(this.parent.node.left);
    }
    return `${name}|${mapping[kind]}`;
  }
  getClassName () {
    let location = this;
    while (location.parent !== null) {
      if (
        location.node.type === "ObjectExpression" ||
        location.node.type === "ClassBody" ||
        location.node.type === "FunctionExpression" ||
        location.node.type === "FunctionDeclaration" ||
        location.node.type === "ArrowFunctionExpression" ||
      ) {
        return location.getName();
      }
      if (location.node.type === "Program") {
        return null;
      }
    }
    logger.error(`Unbound location while query class name`);
    return `__APPMAP_AGENT_ERROR__`;
  }
  getStartLine () {
    return this.node.loc.start.line;
  }
  getNamespace() {
    let location = this;
    while (location.parent !== null) {
      location = location.parent;
    }
    return location.namespace;
  }
  shouldBeInstrumented() {
    // TODO add some logic here
    return true;
  }
  makeEntity(childeren) {
    if (
      this.node.type === 'ArrowFunctionExpression' ||
      this.node.type === 'FunctionExpression' ||
      this.node.type === 'FunctionDeclaration'
    ) {
      return {
        type: 'class',
        name: this.getName(),
        childeren: [
          {
            type: 'function',
            name: '()',
            source: this.getFile()
              .getContent()
              .substring(this.node.start, this.node.end),
            location: `${this.getFile().getPath()}:${this.node.loc.start.line}`,
            labels: [],
            comment: null,
            static: this.isStaticMethod()
          },
        ].concat(childeren),
      };
    }
    if (
      this.node.type === 'ObjectExpression' ||
      this.node.type === 'ClassBody'
    ) {
      return {
        type: 'class',
        name: this.getName(),
        childeren,
      };
    }
    if (this.node.type === 'Program') {
      return {
        type: 'package',
        name: this.getName(),
        childeren,
      };
    }
    logger.error(
      `Invalid node type for creating entity, got: ${this.node.type}`,
    );
    return {
      type: '__APPMAP_AGENT_ERROR__',
      name: this.getName(),
      childeren,
    };
  }
}

export class RootLocation {
  constructor(file, namespace) {
    this.parent = null;
    this.file = file;
    this.namespace = namespace;
  }
  extend(kind, node) {
    return new Location(kind, node, this);
  }
  shouldBeInstrumented() {
    return true;
  }
  getFile() {
    return this.file;
  }
  getNamespace() {
    return this.namespace;
  }
  makeEntity() {
    throw new Error('RootLocation cannot create entity');
  }
}
