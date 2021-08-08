export default (dependencies) => {
  const {
    expect: { expect },
    util: { assert },
  } = dependencies;

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

  return {
    checkIdentifierClash: (lineage, { runtime, path }) => {
      if (
        lineage !== null &&
        lineage.head.type === "Identifier" &&
        lineage.head.name.startsWith(runtime)
      ) {
        const { name } = lineage.head;
        assert(
          lineage.tail !== null,
          "identifier node should always have a parent",
        );
        expect(
          isNonScopingIdentifier(lineage.head, lineage.tail.head),
          "identifier collision detected in file %j, the identifier %j should not start with %j",
          path,
          name,
          runtime,
        );
      }
    },
  };
};
