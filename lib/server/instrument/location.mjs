import { assert } from '../assert.mjs';

const getBound = ({ bound }) => bound;

const getNotBound = ({ bound }) => !bound;

const getKeyName = (location) => {
  assert(
    location.node.type === 'Property' ||
      location.node.type === 'MethodDefinition',
    'invalid node type %o',
    location.node.type,
  );
  if (location.node.computed) {
    return '[#computed]';
  }
  if (location.node.key.type === 'Identifier') {
    return location.node.key.name;
  }
  assert(location.node.key.type === 'Literal', 'invalid non-computed key node');
  assert(
    typeof location.node.key.value === 'string',
    'invalid non-computed key literal node',
  );
  return JSON.stringify(location.node.key.value);
};

const getName = (location) => {
  if (location.name === null) {
    location.name = computeName(location);
  }
  return location.name;
};

const tags = {
  __proto__: null,
  ObjectExpression: 'object',
  ArrowFunctionExpression: 'arrow',
  FunctionExpression: 'function',
  FunctionDeclaration: 'function',
  ClassExpression: 'class',
  ClassDeclaration: 'class',
};

const isObjectBound = (location) =>
  location.parent.node.type === 'Property' &&
  location.parent.node.value === location.node &&
  location.parent.parent.node.type === 'ObjectExpression';

const isClassBound = (location) =>
  location.parent.node.type === 'MethodDefinition' &&
  location.parent.node.value === location.node &&
  location.parent.parent.node.type === 'ClassBody';

const isBound = (location) => isObjectBound(location) || isClassBound(location);

const computeName = (location) => {
  // assert(location.hasName(), 'invalid node type %o for name query', location.node.type);
  // if (location.node.type === "Program") {
  //   return `#${location.common.file.getRelativePath()}`;
  // }
  assert(
    location.node.type in tags,
    'invalid node type %o for computing name',
    location.node.type,
  );
  if (isObjectBound(location)) {
    let name = '';
    if (location.parent.node.kind !== 'init') {
      name = `${name}${location.parent.node.kind} `;
    }
    name = `${name}${getKeyName(location.parent)}`;
    return name;
  }
  if (isClassBound(location)) {
    if (location.parent.node.kind === 'constructor') {
      return 'constructor';
    }
    let name = getKeyName(location.parent);
    if (location.parent.node.kind !== 'method') {
      name = `${location.parent.node.kind} ${name}`;
    }
    return name;
  }
  if (
    location.node.type === 'FunctionDeclaration' ||
    location.node.type === 'ClassDeclaration'
  ) {
    return location.node.id === null ? 'default' : location.node.id.name;
  }
  if (
    (location.node.type === 'FunctionExpression' ||
      location.node.type === 'ClassExpression') &&
    location.node.id !== null
  ) {
    return location.node.id.name;
  }
  if (
    location.parent.node.type === 'AssignmentExpression' &&
    location.parent.node.right === location.node &&
    location.parent.node.operator === '=' &&
    location.parent.node.left.type === 'Identifier'
  ) {
    return location.parent.node.left.name;
  }
  if (
    location.parent.node.type === 'VariableDeclarator' &&
    location.parent.node.init === location.node &&
    location.parent.node.id.type === 'Identifier'
  ) {
    return location.parent.node.id.name;
  }
  const tag = tags[location.node.type];
  return `${tag}#${(location.common.counters[tag] += 1)}`;
};

class Location {
  constructor(node, location, common) {
    this.node = node;
    this.parent = location;
    this.common = common;
    this.name = null;
  }
  extend(node) {
    return new Location(node, this, this.common);
  }
  getOrigin(node) {
    return this.common.origin;
  }
  getSession(node) {
    return this.common.session;
  }
  getFile() {
    return this.common.file;
  }
  getClosureDesignator() {
    assert(
      this.node.type === 'ArrowFunctionExpression' ||
        this.node.type === 'FunctionExpression' ||
        this.node.type === 'FunctionDeclaration',
      'invalid node type %o for getClosureKey',
      this.node.type,
    );
    return {
      path: this.common.file.getRelativePath(),
      lineno: this.node.loc.start.line,
      static:
        this.node.type === 'FunctionExpression' &&
        this.parent.node.type === 'MethodDefinition' &&
        this.parent.node.value === this.node &&
        this.parent.node.static,
      defined_class: getName(this),
      method_id: getName(this),
    };
  }
  isExcluded() {
    return this.node.type in tags && this.common.exclude.has(getName(this));
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
  wrapEntityArray(entities) {
    if (
      this.node.type === 'ArrowFunctionExpression' ||
      this.node.type === 'FunctionExpression' ||
      this.node.type === 'FunctionDeclaration'
    ) {
      assert(
        entities.every(getNotBound),
        'unbound code entity escaped to closure',
      );
      const designator = this.getClosureDesignator();
      return [
        {
          type: 'class',
          name: designator.defined_class,
          bound: isBound(this),
          children: [
            {
              type: 'function',
              source: this.common.source
                ? this.common.file
                    .getContent()
                    .substring(this.node.start, this.node.end)
                : null,
              labels: [],
              comment: null,
              name: designator.method_id,
              location: `${designator.path}:${designator.lineno}`,
              static: designator.static,
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
          name: getName(this),
          bound: isBound(this),
          children: entities.filter(getBound),
        },
        ...entities.filter(getNotBound),
      ];
    }
    return entities;
  }
}

export class RootLocation {
  constructor(common) {
    this.node = null;
    this.parent = null;
    this.common = common;
  }
  extend(node) {
    return new Location(node, this, this.common);
  }
  getFile() {
    return this.common.file;
  }
}
