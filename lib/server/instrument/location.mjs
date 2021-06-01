import { assert } from '../assert.mjs';

const getBound = ({bound}) => bound;

const getNotBound = ({bound}) => !bound;

const getKeyName = (location) => {
  if (location.node.computed) {
    return "[#computed]";
  }
  if (location.node.key.type === "Identifier") {
    return location.node.key.name;
  }
  assert(location.node.key.type === "Literal", "invalid non-computed key node");
  assert(typeof location.node.key.value === "string", "invalid non-computed key literal node");
  return JSON.stringify(location.node.key.value);
};

const isBound = (location) => (
  (
    (
      location.parent.node.type === "Property" &&
      location.parent.parent.node.type === "ObjectExpression") ||
    (
      location.parent.node.type === "MethodDefinition" &&
      location.parent.parent.node.type === "ClassBody")) &&
  location.parent.node.value === location.node
);

const getBoundName = (location) => {
  if (location.parent.node.type === "Property") {
    if (location.parent.node.kind === "init") {
      return getKeyName(location.parent);
    }
    return `${location.parent.kind} ${getKeyName(location.parent)}`;
  }
  if (location.parent.node.type === "MethodDefinition") {
    if (location.parent.node.kind === "constructor") {
      return "constructor";
    }
    const prefix = location.parent.node.static ? "static " : "";
    if (location.parent.node.kind === "method") {
      return `${prefix}${getKeyName(location.parent.node)}`;
    }
    return `${prefix}${location.parent.kind} ${getKeyName(location.parent)}`;
  }
};

const getFreeName = (location) => {
  if (
    location.node.type === "FunctionDeclaration" ||
    location.node.type === "ClassDeclaration"
  ) {
    if (location.node.id === null) {
      return "default";
    }
    return location.node.id.name;
  }
  if (
    (
      location.node.type === "FunctionExpression" ||
      location.node.type === "ClassExpression") &&
    location.node.id !== null
  ) {
    return location.node.id.name;
  }
  if (
    location.parent.node.type === "AssignmentExpression" &&
    location.parent.node.right === location.node &&
    location.parent.node.operator === "=" &&
    location.parent.node.left.type === "Identifier"
  ) {
    return location.parent.node.left.name;
  }
  if (
    location.parent.node.type === "VariableDeclarator" &&
    location.parent.node.init === location.node &&
    location.parent.node.id.type === "Identifier"
  ) {
    return location.parent.node.id.name;
  }
  return null;
};

class Location {
  constructor(node, location, file) {
    this.node = node;
    this.parent = location;
    this.file = file;
  }
  extend(node) {
    return new Location(node, this, this.file);
  }
  getFile() {
    return this.file;
  }
  getParentContainerName() {
    return this.parent.getContainerName();
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
  isStaticMethod() {
    return (
      this.node.type === 'FunctionExpression' &&
      this.parent.node.type === 'MethodDefinition' &&
      this.parent.node.value === this.node &&
      this.parent.node.static
    );
  }
  getStartLine() {
    return this.node.loc.start.line;
  }
  getStartColumn() {
    return this.node.loc.start.column;
  }
  isNonScopingIdentifier() {
    assert(this.node.type === "Identifier");
    if (
      this.parent.node.type === 'BreakStatement' ||
      this.parent.node.type === 'ContinueStatement' ||
      this.parent.node.type === 'LabeledStatement'
    ) {
      return this.parent.node.label === this.node;
    }
    if (this.parent.node.type === 'ExportSpecifier') {
      return this.parent.node.exported === this.node;
    }
    if (this.parent.node.type === 'ImportSpecifier') {
      return this.parent.node.imported === this.node;
    }
    if (this.parent.node.type === 'MemberExpression') {
      return this.parent.node.property === this.node && !this.parent.node.computed;
    }
    if (
      this.parent.node.type === 'MethodDefinition' ||
      this.parent.node.type === 'Property'
    ) {
      return this.parent.node.key === this.node && !this.node.computed;
    }
    return false;
  }
  wrapEntityArray(entities) {
    if (
      this.node.type === 'ArrowFunctionExpression' ||
      this.node.type === 'FunctionExpression' ||
      this.node.type === 'FunctionDeclaration'
    ) {
      const bound = isBound(this);
      return [{
        type: 'class',
        bound,
        name: bound ? getBoundName(this) : getFreeName(this),
        children: [
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
        ... entities],
      }];
    }
    if (
      this.node.type === 'ObjectExpression' ||
      this.node.type === 'ClassExpression' ||
      this.node.type === "ClassDeclaration"
    ) {
      const bound = isBound(this);
      return [{
        type: 'class',
        bound,
        name: bound ? getBoundName(this) : getFreeName(this),
        children: entities.filter(getBound),
      }, ... entities.filter(getNotBound)];
    }
    return entities;
  }
}

export class RootLocation {
  constructor(file) {
    this.node = null;
    this.parent = null;
    this.file = file;
  }
  extend(node) {
    return new Location(node, this, this.file);
  }
  getFile(node) {
    return this.file;
  }
}
