import { strict as Assert } from 'assert';
// import { parse as acorn } from 'acorn';
import { generate as escodegen } from 'escodegen';

import { RootLocation } from '../../../../lib/instrument/location.mjs';
import File from '../../../../lib/file.mjs';
import Namespace from '../../../../lib/namespace.mjs';
import { visit, getResultNode } from '../../../../lib/instrument/visit.mjs';

export const test = (options) => {
  const { path, ecma, source, input, output, prefix, keys } = {
    path: 'filname.js',
    ecma: 2020,
    source: 'script',
    input: null,
    output: null,
    prefix: '$',
    keys: null,
    ...options,
  };
  let location = new RootLocation();
  const namespace = new Namespace(prefix);
  const file = new File(path, ecma, source, input);
  let node1 = file.parse();
  let node2 = node1;
  if (output !== null) {
    node2 = new File(path, ecma, source, output).parse();
  }
  const step = (key) => {
    node1 = node1[key];
    node2 = node2[key];
  };
  keys.forEach((key) => {
    location = location.extend(node1);
    if (Array.isArray(key)) {
      key.forEach(step);
    } else {
      step(key);
    }
  });
  const result = visit(node1, {
    namespace,
    location,
    file,
  });
  // console.log("1", getResultNode(result));
  // console.log("2", escodegen(getResultNode(result)));
  // console.log("3", node2);
  // console.log("4", escodegen(node2));
  Assert.equal(escodegen(getResultNode(result)), escodegen(node2));
};

//
// const options = {
//   ecmaVersion: 2020,
//   sourceType: 'script',
//   locations: true,
// };
//
// const parsers = {
//   __proto__: null,
//   Program: (code) => acorn(`${code}`, options),
//   Statement: (code) => acorn(`${code}`, options).body[0],
//   Expression: (code) => acorn(`(${code});`, options).body[0].expression,
//   SpreadableExpression: (code) => acorn(`[${code}];`, options).body[0].expression.elements[0],
//   Pattern: (code) => acorn(`[...${code}] = 123;`, options).body[0].expression.left.elements[0].argument,
//   RestablePattern: (code) => acorn(`[${code}] = 123;`, options).body[0].expression.left.elements[0],
// };
//
// export const parse = (kind, code) => {
//   if (kind in parsers) {
//     return parsers[kind](code);
//   }
//   throw new Error(`Cannot parse ${kind}`);
// };
//
// export const mockResult = (node, entities) => ({ node, entities });
//
// export const mapResult = (callback, {node, entities}) => ({
//   node: callback(node),
//   entities
// });
//
// export const compareResult = (result1, result2) => {
//   console.log("1", result1.node);
//   console.log("1", escodegen(result1.node));
//   // console.log("2", result2.node);
//   // console.log("2", escodegen(result2.node));
//   Assert.equal(escodegen(result1.node), escodegen(result2.node));
//   Assert.deepEqual(result1.entities, result2.entities);
// };
//
// export const testProgram = (code, prefix) => {
//   const namespace = new Namespace(prefix);
//   const file = new File('filename.js', 2020, 'script', code);
//   const location0 = new RootLocation();
//   const node0 = file.parse();
//   Assert.equal(
//     escodegen(getResultNode(visit(node0, {
//       namespace,
//       location: location0,
//       file,
//     }))),
//     escodegen(node0));
// };
//
// export const testStatement = (code, prefix) => {
//   const namespace = new Namespace(prefix);
//   const file = new File('filename.js', 2020, 'script', code);
//   const location0 = new RootLocation();
//   const node0 = file.parse();
//   Assert.equal(
//     escodegen(getResultNode(visit(node0.body[0], {
//       namespace,
//       location: location0.extend(node1),
//       file,
//     }))),
//     escodegen(node0.body[0]));
// };
//
//
//
// export const testPattern = (code, prefix) => {
//   const namespace = new Namespace(prefix);
//   const file = new File('filename.js', 2020, 'script', `([${code}] = 123);`);
//   const location0 = new RootLocation();
//   const node0 = file.parse();
//   const location1 = location0.extend(node0);
//   const node1 = node0.body[0];
//   const location2 = locatin1.extend(node)
//   Assert.equal(
//     escodegen(getResultNode(visit(node0.body[0], {
//       namespace,
//       location: location0.extend(node1),
//       file,
//     }))),
//     escodegen(node0.body[0]));
// };
//
// export const testExpression = (code) => {
//   const namespace = new Namespace("$");
//   const file = new File('filename.js', 2020, 'script', `(${code});`);
//   const location0 = new RootLocation();
//   const node1 = file.parse();
//   const location1 = location0.extend(file.parse());
//   const node2 = node1.body[0];
//   const location2 = location1.extend(node2);
//   Assert.equal(
//     escodegen(getResultNode(visit(node2.expression, {
//       namespace,
//       location: location2,
//       file,
//     }))),
//     escodegen(node2.expression));
// };
//
// export const testSpecialExpression = (code1) => {
//   const namespace = new Namespace("$");
//   const file = new File(`filename.js`, 2020, 'script', `({ async * m () { (${code1}); }});`);
//   const location0 = new RootLocation();
//   const node1 = file.parse();
//   const location1 = location0.extend(node1);
//   const node2 = node1.body[0];
//   const location2 = location1.extend(node2);
//   const node3 = node2.expression;
//   const location3 = location2.extend(node3);
//   const node4 = node3.properties[0];
//   const location4 = location3.extend(node4);
//   const node5 = node4.value;
//   const location5 = location4.extend(node5);
//   const node6 = node5.body;
//   const location6 = location5.extend(node6);
//   const node7 = node6.body[0];
//   const location7 = location6.extend(node7);
//   Assert.equal(
//     escodegen(getResultNode(visit(node7.expression, {
//       namespace,
//       location: location7,
//       file,
//     }))),
//     escodegen(node7.expression));
// }
