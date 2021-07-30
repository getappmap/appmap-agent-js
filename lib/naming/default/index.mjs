const { stringify } = JSON;
const _String = String;
const { isArray } = Array;
const _Set = Set;

const nameable = new _Set([
  "ObjectExpression",
  "ClassExpression",
  "ClassDeclaration",
  "FunctionExpression",
  "FunctionDeclaration",
  "ArrowFunctionExpression",
]);

export default (dependencies) => {
  const {
    util: { incrementCounter, coalesce },
  } = dependencies;

  const getKeyName = (node) => {
    if (node.computed) {
      return "[computed]";
    }
    if (node.key.type === "Literal") {
      return `${stringify(node.key.value)}`;
    }
    return node.key.name;
  };

  const getEnvironmentName = (counter, lineage) => {
    if (lineage !== null) {
      if (
        lineage.head.type === "FunctionDeclaration" ||
        lineage.head.type === "ClassDeclaration"
      ) {
        return coalesce(lineage.head.id, "name", "default");
      }
      if (
        lineage.tail !== null &&
        lineage.tail.head.type === "AssignmentExpression" &&
        lineage.tail.head.operator === "=" &&
        lineage.tail.head.right === lineage.head &&
        lineage.tail.head.left.type === "Identifier"
      ) {
        return lineage.tail.head.left.name;
      }
      if (
        lineage.tail !== null &&
        lineage.tail.head.type === "VariableDeclarator" &&
        lineage.tail.head.init === lineage.head &&
        lineage.tail.head.id.type === "Identifier"
      ) {
        return lineage.tail.head.id.name;
      }
      if (
        lineage.head.type === "FunctionExpression" ||
        lineage.head.type === "ClassExpression"
      ) {
        return coalesce(lineage.head.id, "name", null);
      }
    }
    return _String(incrementCounter(counter));
  };

  const isObjectBound = (lineage) =>
    lineage !== null &&
    lineage.tail !== null &&
    lineage.tail.tail !== null &&
    lineage.tail.head.type === "Property" &&
    lineage.tail.tail.head.type === "ObjectExpression" &&
    lineage.tail.head.value === lineage.head;

  const isClassBound = (lineage) =>
    lineage !== null &&
    lineage.tail !== null &&
    lineage.tail.head.type === "MethodDefinition" &&
    lineage.tail.head.value === lineage.head;

  return {
    getLineage: (node, path) => {
      let lineage = { head: node, tail: null };
      for (let segment of path.split("/")) {
        node = node[segment];
        if (!isArray(node)) {
          lineage = { head: node, tail: lineage };
        }
      }
      return lineage;
    },
    parseQualifiedName: (name) => {
      const parts = /^(.*)(\.|#)(.*)$/.exec(name);
      if (parts === null) {
        return {
          qualifier: null,
          static: false,
          name,
        };
      }
      return {
        qualifier: parts[1],
        static: parts[2] === "#",
        name: parts[3],
      };
    },
    getQualifiedName: (counter, lineage) => {
      if (lineage === null || !nameable.has(lineage.head.type)) {
        return null;
      }
      if (isObjectBound(lineage)) {
        return `${getEnvironmentName(counter, lineage.tail)}.${getKeyName(
          lineage.tail.head,
        )}`;
      }
      if (isClassBound(lineage)) {
        return `${getEnvironmentName(counter, lineage.tail)}${
          lineage.tail.head.static ? "#" : "."
        }${getKeyName(lineage.tail.head)}`;
      }
      return getEnvironmentName(counter, lineage);
    },
  };
};
