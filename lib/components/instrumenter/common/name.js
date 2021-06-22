
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

const isObjectBound = (list) =>
  list.tail.head.type === 'Property' &&
  list.tail.head.value === list.head &&
  list.tail.tail.head.type === 'ObjectExpression';

const isClassBound = (list) =>
  list.tail.head.type === 'MethodDefinition' &&
  list.tail.head.value === list.head &&
  list.tail.tail.head.type === 'ClassBody';

const isBound = (list) => isObjectBound(list) || isClassBound(list);

const computeName = (counters, list) => {
  // assert(location.hasName(), 'invalid node type %o for name query', location.node.type);
  // if (location.node.type === "Program") {
  //   return `#${location.common.file.getRelativePath()}`;
  // }
  assert(
    list.head.type in tags,
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
  return `${tag}-${(location.common.counters[tag] += 1)}`;
};
