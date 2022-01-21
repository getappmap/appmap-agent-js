/* eslint-env node */

import { parse as parseProgram } from "acorn";

const isNotImportDeclaration = (node) => node.type !== "ImportDeclaration";

const extractBody = (node, content) => {
  if (
    node.type === "ExportDefaultDeclaration" &&
    node.declaration.type === "CallExpression" &&
    node.declaration.arguments.length === 0 &&
    node.declaration.callee.type === "ArrowFunctionExpression" &&
    node.declaration.callee.async &&
    node.declaration.callee.params.length === 0 &&
    node.declaration.callee.body.type === "BlockStatement"
  ) {
    const { length } = node.declaration.callee.body.body;
    if (length === 0) {
      return "";
    } else {
      return content.substring(
        node.declaration.callee.body.body[0].start,
        node.declaration.callee.body.body[length - 1].end,
      );
    }
  } else {
    return content.substring(node.start, node.end);
  }
};

const generateTransform =
  (transform) =>
  ({ path, content }) => {
    const program = parseProgram(content, {
      sourceType: "module",
      ecmaVersion: 2022,
      allowAwaitOutsideFunction: true,
    });
    const index = program.body.findIndex(isNotImportDeclaration);
    if (index === -1) {
      return { path, content };
    } else {
      const node = program.body[index];
      return {
        path,
        content: transform(
          content.substring(0, node.start),
          index === program.body.length - 1
            ? extractBody(node, content)
            : content.substring(node.start),
        ),
      };
    }
  };

export const wrapFile = generateTransform(
  (head, body) =>
    `${head}${"\n\n"}export default ((async () => { ${body} }) ());${"\n"}`,
);

export const unwrapFile = generateTransform(
  (head, body) => `${head}${"\n\n"}${body}${"\n"}`,
);
