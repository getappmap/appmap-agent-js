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
  get: 'getter',
  set: 'setter',
  method: 'method',
  init: 'value',
  constructor: 'constructor',
};

export default class Location {
  constructor(kind, node, location, common) {
    this.kind = kind;
    this.node = node;
    this.parent = location;
    this.common = node;
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
    return typeof this === 'object'; // class-methods-use-this
  }
  isStaticMethod() {
    return (
      this.parent !== null &&
      this.parent.node.type === 'MethodDefinition' &&
      this.parent.node.value === this.node &&
      this.parent.node.static
    );
  }
  getName() {
    let name = EMPTY_NAME;
    let kind = 'empty';
    if (
      this.parent !== null &&
      this.parent.node.type === 'MethodDefinition' &&
      this.parent.node.value === this.node &&
      this.parent.parent !== null &&
      this.parent.parent.node === 'ClassBody'
    ) {
      name = getKeyName(this.parent.node);
      kind = `${this.parent.node.static ? 'constructor' : 'prototype'}-${
        mapping[this.parent.kind]
      }`;
    } else if (
      this.parent !== null &&
      this.parent.node.type === 'Property' &&
      this.parent.node.value === this.node &&
      this.parent.parent !== null &&
      this.parent.parent.node.type === 'ObjectExpression'
    ) {
      name = getKeyName(this.parent.node);
      kind = `object-${
        mapping[this.parent.node.method ? 'method' : this.parent.node.kind]
      }`;
    } else if (
      this.parent !== null &&
      this.parent.node.type === 'VariableDeclarator' &&
      this.parent.node.init === this.node &&
      this.parent.parent !== null &&
      this.parent.parent.type === 'VariableDeclaration'
    ) {
      name = getVariableName(this.parent.node.id);
      kind = this.parent.parent.node.kind;
    } else if (
      this.parent !== null &&
      this.parent.node.type === 'AssignmentExpression' &&
      this.parent.node.operator === '=' &&
      this.parent.node.left.right === this.node
    ) {
      name = getVariableName(this.parent.node.left);
      kind = 'assignment';
    } else if (this.node.type === 'ClassDeclaration' && this.node.id !== null) {
      name = getVariableName(this.node.id);
      kind = 'class';
    } else if (
      this.node.type === 'FunctionDeclaration' &&
      this.node.id !== null
    ) {
      name = getVariableName(this.node.id);
      kind = 'function';
    }
    return `${name}|${kind}`;
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
            source: this.file
              .getContent()
              .substring(this.node.start, this.node.end),
            location: `${this.file.getPath()}:${this.node.loc.start.line}`,
            labels: [],
            comment: null,
            static: this.isStaticMethod(),
          },
        ].concat(childeren),
      };
    }
    if (
      this.node.type === 'ObjectExpression' ||
      this.node.type === 'ClassExpression' ||
      this.node.type === 'ClassDeclaration'
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
        name: this.common.file.getPath(),
        childeren,
      };
    }
    logger.error(
      `Invalid node type for creating appmap, got: ${this.node.type}`,
    );
    return {
      type: '__APPMAP_ERROR__',
      name: this.node.type,
      childeren: [],
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
}
