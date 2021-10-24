import Naming from "./naming.mjs";

const { ownKeys } = Reflect;
const { isArray } = Array;

export default (dependencies) => {
  const {
    util: { hasOwnProperty },
  } = dependencies;

  const { getName } = Naming(dependencies);

  const isMaybeNodeKey = (key) =>
    key !== "type" && key !== "loc" && key !== "start" && key !== "end";

  const concatResult = ({ head, body }) =>
    head === null ? body : [head, ...body];

  const visitBody = (nodes, parent, grand_parent, name, context) => {
    const head_children = [];
    const body_children = [];
    for (const node of nodes) {
      const { head, body } = visit(node, parent, grand_parent, context);
      if (head !== null) {
        head_children.push(head);
      }
      body_children.push(...body);
    }
    return {
      head: {
        type: "class",
        name,
        children: head_children,
      },
      body: body_children,
    };
  };

  const initial_parent = { type: "File" };
  const initial_grand_parent = { type: "Root" };

  // let depth = 0;
  // const visit = (node, ...args) => {
  //   depth += 1;
  //   console.log("*".repeat(depth), node && node.type);
  //   const result = visitInner(node, ...args);
  //   console.log("*".repeat(depth), JSON.stringify(result));
  //   depth -= 1;
  //   return result;
  // };

  const visit = (node, parent, grand_parent, context) => {
    if (isArray(node)) {
      return {
        head: null,
        body: node.flatMap((child) =>
          concatResult(visit(child, parent, grand_parent, context)),
        ),
      };
    }
    if (
      typeof node === "object" &&
      node !== null &&
      hasOwnProperty(node, "type")
    ) {
      const { type } = node;
      if (
        type === "FunctionExpression" ||
        type === "FunctionDeclaration" ||
        type === "ArrowFunctionExpression"
      ) {
        const {
          start,
          end,
          loc: {
            start: { line, column },
          },
        } = node;
        const { naming, getLeadingCommentArray } = context;
        return {
          head: {
            type: "function",
            name: getName(naming, node, parent),
            children: [
              ...concatResult(visit(node.params, node, parent, context)),
              ...concatResult(visit(node.body, node, parent, context)),
            ],
            parameters: node.params.map(({ start, end }) => [start, end]),
            labels: [],
            static: parent.type === "MethodDefinition" && parent.static,
            comments: getLeadingCommentArray(node),
            range: [start, end],
            line,
            column,
          },
          body: [],
        };
      }
      if (
        type === "MethodDefinition" ||
        (type === "Property" && parent.type === "ObjectExpression")
      ) {
        const { head, body } = visit(node.value, node, parent, context);
        return {
          head,
          body: [
            ...concatResult(visit(node.key, node, parent, context)),
            ...body,
          ],
        };
      }
      if (type === "ObjectExpression") {
        const { naming } = context;
        return visitBody(
          node.properties,
          node,
          parent,
          getName(naming, node, parent),
          context,
        );
      }
      if (type === "ClassBody") {
        const { naming } = context;
        return visitBody(
          node.body,
          node,
          parent,
          getName(naming, parent, grand_parent),
          context,
        );
      }
      return {
        head: null,
        body: ownKeys(node)
          .filter(isMaybeNodeKey)
          .flatMap((key) =>
            concatResult(visit(node[key], node, parent, context)),
          ),
      };
    }
    return { head: null, body: [] };
  };

  return {
    visit: (node, context) =>
      concatResult(visit(node, initial_parent, initial_grand_parent, context)),
  };
};
