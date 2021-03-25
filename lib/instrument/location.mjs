import Logger from '../logger.mjs';

const logger = new Logger(import.meta.url);

const getPatternName = (node) => {
  if (node === null) {
    return '@#default';
  }
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

class Location {
  constructor(kind, node, location) {
    this.kind = kind;
    this.node = node;
    this.parent = location;
  }
  extend(kind, node) {
    return new Location(kind, node, this);
  }
  getKind() {
    if (this.node.type === 'VariableDeclaration') {
      return this.node.kind;
    }
    logger.error(`Invalid node for getKind()`);
    return '__APPMAP_AGENT_ERROR_LOCATION_GET_KIND__';
  }
  getChildName(node) {
    if (this.node.type === 'VariableDeclarator' && this.node.init === node) {
      return `${getPatternName(this.node.id)}|${this.parent.getKind()}`;
    }
    if (this.node.type === 'AssignmentExpression' && this.node.right === node) {
      return `${getPatternName(this.node.left)}|assignment`;
    }
    if (this.node.type === 'MethodDefinition' && this.node.value === node) {
      return `${this.node.static ? 'constructor' : 'prototype'}${getKeyName(
        this.node,
      )}|${this.node.kind}`;
    }
    if (this.node.type === 'Property' && this.node.value === node) {
      return `singleton${getKeyName(this.node)}|${
        this.node.method ? 'method' : this.node.kind
      }`;
    }
    return `§none`;
  }
  getName() {
    if (this.node.type === 'Program') {
      return this.getFile().getPath();
    }
    if (this.node.type === 'FunctionDeclaration') {
      return `${getPatternName(this.node.id)}|function`;
    }
    if (this.node.type === 'ClassDeclaration') {
      return `${getPatternName(this.node.id)}|class`;
    }
    if (this.node.type === 'ClassBody') {
      return this.parent.getName();
    }
    return this.parent.getChildName(this.node);
  }
  getContainerName() {
    if (
      this.node.type === 'Program' ||
      this.node.type === 'ObjectExpression' ||
      this.node.type === 'ClassExpression' ||
      this.node.type === 'ClassDeclaration' ||
      this.node.type === 'FunctionExpression' ||
      this.node.type === 'FunctionDeclaration' ||
      this.node.type === 'ArrowFunctionExpression'
    ) {
      return this.getName();
    }
    return this.parent.getContainerName();
  }
  isChildStaticMethod(node) {
    return (
      this.node.type === 'MethodDefinition' &&
      this.node.value === node &&
      this.node.static
    );
  }
  isStaticMethod() {
    return (
      this.node.type === 'FunctionExpression' &&
      this.parent.isChildStaticMethod(this.node)
    );
  }
  getStartLine() {
    return this.node.loc.start.line;
  }
  getFile() {
    return this.parent.getFile();
  }
  getNamespace() {
    return this.parent.getNamespace();
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
            static: this.isStaticMethod(),
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
      type: '__APPMAP_AGENT_ERROR_LOCATION_MAKE_ENTITY__',
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
  makeEntity(childeren) {
    logger.error(`RootLocation.makeEntity()`);
    return {
      type: '__APPMAP_AGENT_ERROR_ROOT_LOCATION_MAKE_ENTITY__',
      name: this.getName(),
      childeren,
    };
  }
  isStaticMethod() {
    logger.error(`RootLocation.isStaticMethod()`);
    return false;
  }
  isChildStaticMethod() {
    logger.error(`RootLocation.isChildStaticMethod()`);
    return false;
  }
  getStartLine() {
    logger.error(`RootLocation.getStartLine()`);
    return 0;
  }
  getName() {
    logger.error(`RootLocation.getName()`);
    return '__APPMAP_AGENT_ERROR_ROOT_LOCATION_GET_NAME__';
  }
  getChildName() {
    logger.error(`RootLocation.getChildName()`);
    return '__APPMAP_AGENT_ERROR_ROOT_LOCATION_GET_CHILD_NAME__';
  }
  getKind() {
    logger.error(`RootLocation.getKind()`);
    return '__APPMAP_AGENT_ERROR_ROOT_LOCATION_GET_KIND__';
  }
  getContainerName() {
    logger.error(`RootLocation.getContainerName()`);
    return '__APPMAP_AGENT_ERROR_ROOT_LOCATION_GET_CONTAINER_NAME__';
  }
}
