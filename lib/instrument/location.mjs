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
  constructor(node, location) {
    this.node = node;
    this.parent = location;
  }
  extend(node) {
    return new Location(node, this);
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
  getName(file) {
    if (this.node.type === 'Program') {
      return file.getPath();
    }
    if (this.node.type === 'FunctionDeclaration') {
      return `${getPatternName(this.node.id)}|function`;
    }
    if (this.node.type === 'ClassDeclaration') {
      return `${getPatternName(this.node.id)}|class`;
    }
    if (this.node.type === 'ClassBody') {
      return this.parent.getName(file);
    }
    return this.parent.getChildName(this.node);
  }
  getParentContainerName(file) {
    return this.parent.getContainerName(file);
  }
  getContainerName(file) {
    if (
      this.node.type === 'Program' ||
      this.node.type === 'ObjectExpression' ||
      this.node.type === 'ClassExpression' ||
      this.node.type === 'ClassDeclaration' ||
      this.node.type === 'FunctionExpression' ||
      this.node.type === 'FunctionDeclaration' ||
      this.node.type === 'ArrowFunctionExpression'
    ) {
      return this.getName(file);
    }
    return this.parent.getContainerName(file);
  }
  isChildStaticMethod(node) {
    if (node.type !== 'FunctionExpression') {
      logger.warning(
        `isChildStaticMethod should only be called on FunctionExpression node, got: ${node.type}`,
      );
      return false;
    }
    return (
      this.node.type === 'MethodDefinition' &&
      this.node.value === node &&
      this.node.static
    );
  }
  isStaticMethod() {
    return this.parent.isChildStaticMethod(this.node);
  }
  getStartLine() {
    return this.node.loc.start.line;
  }
  shouldBeInstrumented(file) {
    // TODO add some logic here
    return true;
  }
  isChildNonScopingIdentifier(node) {
    if (node.type !== 'Identifier') {
      logger.warning(
        `isChildScopingIdentifier should only be called on Identifier node, got: ${node.type}`,
      );
      return false;
    }
    if (this.node.type === "BreakStatement" || this.node.type === "ContinueStatement" || this.node.type === "LabeledStatement") {
      return this.node.label === node;
    }
    if (this.node.type === "ExportSpecifier") {
      return this.node.exported === node;
    }
    if (this.node.type === "ImportSpecifier") {
      return this.node.imported === node;
    }
    if (this.node.type === 'MemberExpression') {
      return this.node.property === node && !this.node.computed;
    }
    if (this.node.type === 'MethodDefinition' || this.node.type === "Property") {
      return this.node.key === node && !this.node.computed;
    }
    return false;
  }
  isNonScopingIdentifier() {
    return this.parent.isChildNonScopingIdentifier(this.node);
  }
  makeEntity(childeren, file) {
    if (
      this.node.type === 'ArrowFunctionExpression' ||
      this.node.type === 'FunctionExpression' ||
      this.node.type === 'FunctionDeclaration'
    ) {
      return {
        type: 'class',
        name: this.getName(file),
        childeren: [
          {
            type: 'function',
            name: '()',
            source: file.getContent().substring(this.node.start, this.node.end),
            location: `${file.getPath()}:${this.node.loc.start.line}`,
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
        name: this.getName(file),
        childeren,
      };
    }
    if (this.node.type === 'Program') {
      return {
        type: 'package',
        name: this.getName(file),
        childeren,
      };
    }
    return null;
  }
}

export class RootLocation {
  extend(node) {
    return new Location(node, this);
  }
  shouldBeInstrumented() {
    return true;
  }
  makeEntity(childeren, file) {
    logger.error(`RootLocation.makeEntity()`);
    return null;
  }
  isStaticMethod() {
    logger.error(`RootLocation.isStaticMethod()`);
    return false;
  }
  isChildStaticMethod() {
    logger.error(`RootLocation.isChildStaticMethod()`);
    return false;
  }
  isChildNonScopingIdentifier() {
    logger.error(`RootLocation.isChildScopingIdentifier()`);
    return false;
  }
  isNonScopingIdentifier() {
    logger.error(`RootLocation.isScopingIdentifier()`);
    return false;
  }
  getStartLine() {
    logger.error(`RootLocation.getStartLine()`);
    return 0;
  }
  getName(file) {
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
  getContainerName(file) {
    logger.error(`RootLocation.getContainerName()`);
    return '__APPMAP_AGENT_ERROR_ROOT_LOCATION_GET_CONTAINER_NAME__';
  }
  getParentContainerName() {
    logger.error(`RootLocation.getParentContainerName()`);
    return '__APPMAP_AGENT_ERROR_ROOT_LOCATION_GET_PARENT_CONTAINER_NAME__';
  }
}
