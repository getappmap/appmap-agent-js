import Naming from "./naming.mjs";

const { ownKeys } = Reflect;
const { isArray } = Array;
const _String = String;

export default (dependencies) => {
  const {
    util: { hasOwnProperty },
  } = dependencies;

  const { getName } = Naming(dependencies);

  const isMaybeNodeKey = (key) =>
    key !== "type" && key !== "loc" && key !== "start" && key !== "end";

  const initial_parent = { type: "File" };
  const initial_grand_parent = { type: "Root" };

  const concatResult = ({ head, body }) =>
    head === null ? body : [head, ...body];

  const visitConcat = (node, parent, grand_parent, context) =>
    concatResult(visit(node, parent, grand_parent, context));

  const visit = (node, parent, grand_parent, context) => {
    if (isArray(node)) {
      return {
        head: null,
        body: node.flatMap((node) =>
          visitConcat(node, parent, grand_parent, context),
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
        const _static = parent.type === "MethodDefinition" && parent.static;
        const {
          loc: {
            start: { line, column },
          },
        } = node;
        const {
          alias,
          path,
          naming,
          inline,
          content,
          getLeadingComment,
          placeholder,
          closures,
        } = context;
        const name = getName(naming, node, parent);
        closures.set(`${alias}/${_String(line)}/${_String(column)}`, {
          parameters: node.params.map(({ start, end }) =>
            content.substring(start, end),
          ),
          defined_class: name,
          method_id: placeholder,
          path,
          lineno: line,
          static: _static,
        });
        return {
          head: {
            type: "class",
            name,
            children: [
              {
                type: "function",
                name: placeholder,
                location: `${path}:${line}`,
                static: _static,
                labels: [],
                comment: getLeadingComment(node),
                source: inline
                  ? content.substring(node.start, node.end)
                  : /* c8 ignore start */ null /* c8 ignore stop */,
              },
              ...visitConcat(node.params, node, parent, context),
              ...visitConcat(node.body, node, parent, context),
            ],
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
          body: [...visitConcat(node.key, node, parent, context), ...body],
        };
      }
      if (type === "ObjectExpression" || type === "ClassBody") {
        const children = [];
        const body = [];
        for (const child of node[
          type === "ObjectExpression" ? "properties" : "body"
        ]) {
          const { head, body } = visit(child, node, parent, context);
          if (head !== null) {
            children.push(head);
          }
          body.push(...body);
        }
        const { naming } = context;
        return {
          head: {
            type: "class",
            name:
              type === "ObjectExpression"
                ? getName(naming, node, parent)
                : getName(naming, parent, grand_parent),
            children,
          },
          body,
        };
      }
      if (type === "ClassExpression" || type === "ClassDeclaration") {
        const { head, body } = visit(node.body, node, parent, context);
        return {
          head,
          body: [
            ...visitConcat(node.superClass, node, parent, context),
            ...body,
          ],
        };
      }
      return {
        head: null,
        body: ownKeys(node)
          .filter(isMaybeNodeKey)
          .flatMap((key) => visitConcat(node[key], node, parent, context)),
      };
    }
    return { head: null, body: [] };
  };

  return {
    visit: (node, context) =>
      visitConcat(node, initial_parent, initial_grand_parent, context),
  };
};
