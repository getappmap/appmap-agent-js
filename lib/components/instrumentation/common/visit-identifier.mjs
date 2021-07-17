
const isNonScopingIdentifier = (node, parent) => {
  if (
    parent.type === "BreakStatement" ||
    parent.type === "ContinueStatement" ||
    parent.type === "LabeledStatement"
  ) {
    return parent.label === node;
  }
  if (parent.type === "ExportSpecifier") {
    return parent.exported === node;
  }
  if (parent.type === "ImportSpecifier") {
    return parent.imported === node;
  }
  if (parent.type === "MemberExpression") {
    return parent.property === node && !parent.computed;
  }
  if (parent.type === "MethodDefinition" || parent.type === "Property") {
    return parent.key === node && !node.computed;
  }
  return false;
};

export default = (dependencies) => {
  const {expect:{expect}} = dependencies;
  return {
    Identifier: {
      prelude: ({head:node, tail:{head:parent}}, {runtime, path}) => {
        const {name, loc:{start:{line, column}}} = node;
        expect(
          !name.startsWith(runtime) || isNonScopingIdentifier(node, parent),
          "identifier collision detected at %s@%j-%j; %j should not start with %j",
          path,
          line,
          column,
          name,
          runtime,
        );
        return null;
      },
    }
  };
};
