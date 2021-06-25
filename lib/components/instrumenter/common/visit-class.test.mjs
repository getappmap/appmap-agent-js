import { strict as Assert } from "assert";
import * as Acorn from "acorn";
import * as Escodegen from "escodegen";
import { Counter } from "../../../util/index.mjs";
import { visit, setVisitor } from "./visit.mjs";
import "./visit-program.mjs";
import "./visit-class.mjs";

Error.stackTraceLimit = Infinity;

for (let type of ["FunctionExpression", "Identifier", "Literal"]) {
  setVisitor(
    type,
    (node, context) => [],
    (node, context, fields) => node,
  );
}

setVisitor(
  "ExportDefaultDeclaration",


setVisitor(
  "ExpressionStatement",
  (node, context) => [visit(node.expression, context, node)],
  (node, context, fields) => ({
    type: "ExpressionStatement",
    expression: fields[0],
  }),
);

const test = (code1, code2 = code1) => {
  const { node, entities } = visit(
    Acorn.parse(code1, {
      ecmaVersion: 2020,
      sourceType: "module",
    }),
    {
      exclude: () => false,
      counter: new Counter(),
    },
    null,
  );
  code1 = Escodegen.generate(node);
  code2 = Escodegen.generate(Acorn.parse(code2, { ecmaVersion: 2020 }));
  Assert.equal(code1, code2);
  return entities;
};

Assert.deepEqual(test("(class { constructor () {} });"), [
  {
    type: "class",
    caption: {
      index: 1,
      name: null,
      origin: "ClassExpression",
    },
    children: [],
  },
]);

Assert.deepEqual(test("(class extends null {});"), [
  {
    type: "class",
    caption: {
      index: 1,
      name: null,
      origin: "ClassExpression",
    },
    children: [],
  },
]);

Assert.deepEqual(test("class c {}"), [
  {
    type: "class",
    caption: {
      index: 1,
      name: "c",
      origin: "ClassDeclaration",
    },
    children: [],
  },
]);

Assert.deepEqual(test("export default class {};"), [
  {
    type: "class",
    caption: {
      index: 1,
      name: "default",
      origin: "ClassDeclaration",
    },
    children: [],
  },
]);

//
// visit(
//   Acorn.parse("(class { m () { } });", {ecmaVersion:2020}),
//   null,
//   {
//     exclude: () => false
//   }
// );
//
// test({
//   input: `(class { m () { } });`,
//   keys: [['body', 0], 'expression'],
// });
//
// test({
//   input: `class f extends null { static get [m] () { } } `,
//   keys: [['body', 0]],
// });
