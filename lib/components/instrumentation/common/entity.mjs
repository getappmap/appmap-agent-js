import { generate } from "escodegen";

export default (dependencies) => {
  return {
    makeEntity: (index, { head: node, tail }, caption, children) => {
      const { type, start, stop, loc } = node;
      let specific = null;
      if (
        type === "ArrowFunctionExpression" ||
        type === "FunctionDeclaration" ||
        type === "FunctionExpression"
      ) {
        const { params } = node;
        let _static = false;
        if (type !== "ArrowFunctionExpression") {
          const { head: parent } = tail;
          const { type: parent_type } = parent;
          if (parent_type === "MethodDefinition") {
            ({ static: _static } = parent);
          }
        }
        specific = {
          params: params.map(generate),
          static: _static,
        };
      }
      return {
        type,
        index,
        span: [start, stop],
        loc,
        caption,
        children,
        specific,
      };
    },
  };
};
