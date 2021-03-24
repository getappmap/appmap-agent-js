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

const getName = (argument) => {
  let kind = 'empty';
  let name = EMPTY_NAME;
  let location = argument; // eslint no-param-reassign
  if (location.node.type === 'ClassBody' && location.parent !== null) {
    location = location.parent;
  }
  // console.log("foo", location.parent?.node);
  // console.log("bar", location.parent?.parent?.node);
  // console.log("qux",
  //   location.parent !== null,
  //   location.parent?.node.type === 'Property',
  //   location.parent?.node.value === location.node,
  //   location.parent?.parent !== null,
  //   location.parent?.parent?.node.type === 'ObjectExpression');
  if (location.node.type === 'ClassDeclaration' && location.node.id !== null) {
    kind = 'class';
    name = getVariableName(location.node.id);
    // if (location.node.id === null) {
    //   name = '#default-export';
    // } else {
    //   name = getVariableName(location.node.id);
    // }
  } else if (
    location.node.type === 'FunctionDeclaration' &&
    location.node.id !== null
  ) {
    kind = 'function';
    name = getVariableName(location.node.id);
    // if (location.node.id === null) {
    //   name = '#default-export';
    // } else {
    //   name = getVariableName(location.node.id);
    // }
  } else if (
    location.parent !== null &&
    location.parent.node.type === 'MethodDefinition' &&
    location.parent.node.value === location.node &&
    location.parent.parent !== null &&
    location.parent.parent.node.type === 'ClassBody'
  ) {
    kind = location.parent.node.kind;
    name = `${
      location.parent.node.static ? 'constructor' : 'prototype'
    }${getKeyName(location.parent.node)}`;
  } else if (
    location.parent !== null &&
    location.parent.node.type === 'Property' &&
    location.parent.node.value === location.node &&
    location.parent.parent !== null &&
    location.parent.parent.node.type === 'ObjectExpression'
  ) {
    kind = location.parent.node.method ? 'method' : location.parent.node.kind;
    name = `singleton${getKeyName(location.parent.node)}`;
  } else if (
    location.parent !== null &&
    location.parent.node.type === 'VariableDeclarator' &&
    location.parent.node.init === location.node &&
    location.parent.parent !== null &&
    location.parent.parent.node.type === 'VariableDeclaration'
  ) {
    kind = location.parent.parent.node.kind;
    name = getVariableName(location.parent.node.id);
  } else if (
    location.parent !== null &&
    location.parent.node.type === 'AssignmentExpression' &&
    location.parent.node.operator === '=' &&
    location.parent.node.right === location.node
  ) {
    kind = 'assignment';
    name = getVariableName(location.parent.node.left);
  }
  return `${name}|${mapping[kind]}`;
};

class Location {
  constructor(kind, node, location, common) {
    this.kind = kind;
    this.node = node;
    this.parent = location;
    this.common = common;
  }
  extend(kind, node) {
    return new Location(kind, node, this, this.common);
  }
  getFile() {
    return this.common.file;
  }
  getNamespace() {
    return this.common.namespace;
  }
  shouldBeInstrumented() {
    // TODO add some logic here
    return typeof this === 'object'; // eslint >> class-methods-use-this
  }
  makeEntity(childeren) {
    if (
      this.node.type === 'ArrowFunctionExpression' ||
      this.node.type === 'FunctionExpression' ||
      this.node.type === 'FunctionDeclaration'
    ) {
      return {
        type: 'class',
        name: getName(this),
        childeren: [
          {
            type: 'function',
            name: '()',
            source: this.common.file
              .getContent()
              .substring(this.node.start, this.node.end),
            location: `${this.common.file.getPath()}:${
              this.node.loc.start.line
            }`,
            labels: [],
            comment: null,
            static:
              this.parent !== null &&
              this.parent.node.type === 'MethodDefinition' &&
              this.parent.node.value === this.node &&
              this.parent.node.static,
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
        name: getName(this),
        childeren,
      };
    }
    if (this.node.type === 'Program') {
      return {
        type: 'package',
        name: this.common.file.getPath(),
        childeren,
      };
    }
    logger.error(
      `Invalid node type for creating entity, got: ${this.node.type}`,
    );
    return {
      type: '__APPMAP_AGENT_ERROR__',
      name: this.node.type,
      childeren,
    };
  }
}

export class RootLocation {
  constructor(file, namespace) {
    this.common = { file, namespace };
  }
  extend(kind, node) {
    return new Location(kind, node, null, this.common);
  }
  shouldBeInstrumented() {
    return true;
  }
  getFile() {
    return this.common.file;
  }
  getNamespace() {
    return this.common.namespace;
  }
  makeEntity() {
    throw new Error('RootLocation cannot create entity');
  }
}
