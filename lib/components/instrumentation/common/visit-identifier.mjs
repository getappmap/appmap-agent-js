export default (dependencies) => {
  const isNonScopingIdentifier = (node, parent) => {
    const { type } = parent;
    if (
      type === "BreakStatement" ||
      type === "ContinueStatement" ||
      type === "LabeledStatement"
    ) {
      const { label } = parent;
      return label === node;
    }
    if (type === "ExportSpecifier") {
      const { exported } = parent;
      return exported === node;
    }
    if (type === "ImportSpecifier") {
      const { imported } = parent;
      return imported === node;
    }
    if (type === "MemberExpression") {
      const { property, computed } = parent;
      return property === node && !computed;
    }
    if (type === "MethodDefinition" || type === "Property") {
      const { key, computed } = parent;
      return key === node && !computed;
    }
    return false;
  };
  const {
    expect: { expect },
  } = dependencies;
  return {
    Identifier: {
      extract: ({ head: node, tail: { head: parent } }, { runtime, path }) => {
        const {
          name,
          loc: {
            start: { line, column },
          },
        } = node;
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
    },
  };
};
