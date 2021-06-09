import { assert } from '../assert.mjs';

const isBound = ({ name }) => name[0] !== '@';

const isNotBound = ({ name }) => name[0] === '@';

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
  isObjectProperty() {
    return (
      this.parent.node.type === 'Property' &&
      this.parent.node.value === this.node &&
      this.parent.parent.node.type === 'ObjectExpression'
    );
  }
  isClassMethod() {
    return (
      this.parent.node.type === 'MethodDefinition' &&
      this.parent.node.value === this.node &&
      this.parent.parent.node.type === 'ClassBody'
    );
  }
  getContainerName() {
    if (this.isObjectProperty()) {
      return this.parent.parent.getName();
    }
    if (this.isClassMethod()) {
      return this.parent.parent.parent.getName();
    }
    return null;
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
    assert(
      this.node.type === 'Identifier',
      'invalid node type %o',
      this.node.type,
    );
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
      return (
        this.parent.node.property === this.node && !this.parent.node.computed
      );
    }
    if (
      this.parent.node.type === 'MethodDefinition' ||
      this.parent.node.type === 'Property'
    ) {
      return this.parent.node.key === this.node && !this.node.computed;
    }
    return false;
  }
  getKeyName() {
    assert(
      this.node.type === 'Property' || this.node.type === 'MethodDefinition',
      'invalid node type %o',
      this.node.type,
    );
    if (this.node.computed) {
      return '[#computed]';
    }
    if (this.node.key.type === 'Identifier') {
      return this.node.key.name;
    }
    assert(this.node.key.type === 'Literal', 'invalid non-computed key node');
    assert(
      typeof this.node.key.value === 'string',
      'invalid non-computed key literal node',
    );
    return JSON.stringify(this.node.key.value);
  }
  hasName() {
    return (
      this.node.type === 'ObjectExpression' ||
      this.node.type === 'ClassExpression' ||
      this.node.type === 'ClassDeclaration' ||
      this.node.type === 'FunctionExpression' ||
      this.node.type === 'FunctionDeclaration' ||
      this.node.type === 'ArrowFunctionExpression'
    );
  }
  getName() {
    assert(this.hasName(), 'invalid node for name query');
    if (this.isObjectProperty()) {
      let name = '';
      if (this.parent.node.kind !== 'init') {
        name = `${name}${this.parent.node.kind} `;
      }
      name = `${name}${this.parent.getKeyName()}`;
      return name;
    }
    if (this.isClassMethod()) {
      if (this.parent.node.kind === 'constructor') {
        return 'constructor';
      }
      let name = '';
      if (this.parent.node.static) {
        name = `${name}static `;
      }
      if (this.parent.node.kind !== 'method') {
        name = `${name}${this.parent.node.kind} `;
      }
      name = `${name}${this.parent.getKeyName()}`;
      return name;
    }
    if (
      this.node.type === 'FunctionDeclaration' ||
      this.node.type === 'ClassDeclaration'
    ) {
      if (this.node.id === null) {
        return '@default';
      }
      return `@${this.node.id.name}`;
    }
    if (
      (this.node.type === 'FunctionExpression' ||
        this.node.type === 'ClassExpression') &&
      this.node.id !== null
    ) {
      return `@${this.node.id.name}`;
    }
    if (
      this.parent.node.type === 'AssignmentExpression' &&
      this.parent.node.right === this.node &&
      this.parent.node.operator === '=' &&
      this.parent.node.left.type === 'Identifier'
    ) {
      return `@${this.parent.node.left.name}`;
    }
    if (
      this.parent.node.type === 'VariableDeclarator' &&
      this.parent.node.init === this.node &&
      this.parent.node.id.type === 'Identifier'
    ) {
      return `@${this.parent.node.id.name}`;
    }
    return '@anonymous';
  }
  wrapEntityArray(entities, source) {
    if (
      this.node.type === 'ArrowFunctionExpression' ||
      this.node.type === 'FunctionExpression' ||
      this.node.type === 'FunctionDeclaration'
    ) {
      return [
        {
          type: 'class',
          name: this.getName(),
          children: [
            {
              type: 'function',
              name: '()',
              source: source
                ? this.file
                    .getContent()
                    .substring(this.node.start, this.node.end)
                : null,
              location: `${this.file.getRelativePath()}:${
                this.node.loc.start.line
              }`,
              labels: [],
              comment: null,
              static: this.isStaticMethod(),
            },
            ...entities,
          ],
        },
      ];
    }
    if (
      this.node.type === 'ObjectExpression' ||
      this.node.type === 'ClassExpression' ||
      this.node.type === 'ClassDeclaration'
    ) {
      return [
        {
          type: 'class',
          name: this.getName(),
          children: entities.filter(isBound),
        },
        ...entities.filter(isNotBound),
      ];
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
