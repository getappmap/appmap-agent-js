import { strict as Assert } from 'assert';
import { parse as acorn } from 'acorn';
import { generate as escodegen } from 'escodegen';

import { RootLocation } from '../../../../lib/instrument/location.mjs';
import File from '../../../../lib/file.mjs';
import Namespace from '../../../../lib/namespace.mjs';
import { setVisitor, visit, getResultNode } from '../../../../lib/instrument/visit.mjs';

const options = {
  ecmaVersion: 2020,
  sourceType: 'script',
  locations: true,
};

const parsers = {
  __proto__: null,
  Program: (code) => acorn(`${code}`, options),
  Statement: (code) => acorn(`${code}`, options).body[0],
  Expression: (code) => acorn(`(${code});`, options).body[0].expression,
  SpreadableExpression: (code) => acorn(`[${code}];`, options).body[0].expression.elements[0],
  Pattern: (code) => acorn(`[...${code}] = 123;`, options).body[0].expression.left.elements[0].argument,
  RestablePattern: (code) => acorn(`[${code}] = 123;`, options).body[0].expression.left.elements[0],
};

export const parse = (kind, code) => {
  if (kind in parsers) {
    return parsers[kind](code);
  }
  throw new Error(`Cannot parse ${kind}`);
};

export const mockResult = (node, entities) => ({ node, entities });

export const mapResult = (callback, {node, entities}) => ({
  node: callback(node),
  entities
});

export const compareResult = (result1, result2) => {
  console.log("1", result1.node);
  console.log("1", escodegen(result1.node));
  // console.log("2", result2.node);
  // console.log("2", escodegen(result2.node));
  Assert.equal(escodegen(result1.node), escodegen(result2.node));
  Assert.deepEqual(result1.entities, result2.entities);
};

export const testExpression = (code) => {
  const namespace = new Namespace("$");
  const file = new File('filename.js', 2020, 'script', `(${code});`);
  const location0 = new RootLocation();
  const node1 = file.parse();
  const location1 = location0.extend(file.parse());
  const node2 = node1.body[0];
  const location2 = location1.extend(node2);
  Assert.equal(
    escodegen(getResultNode(visit(node2.expression, {
      namespace,
      location: location2,
      file,
    }))),
    escodegen(node2.expression));
};

export const testSpecialExpression = (code1) => {
  const namespace = new Namespace("$");
  const file = new File(`filename.js`, 2020, 'script', `({ async * m () { (${code1}); }});`);
  const location0 = new RootLocation();
  const node1 = file.parse();
  const location1 = location0.extend(node1);
  const node2 = node1.body[0];
  const location2 = location1.extend(node2);
  const node3 = node2.expression;
  const location3 = location2.extend(node3);
  const node4 = node3.properties[0];
  const location4 = location3.extend(node4);
  const node5 = node4.value;
  const location5 = location4.extend(node5);
  const node6 = node5.body;
  const location6 = location5.extend(node6);
  const node7 = node6.body[0];
  const location7 = location6.extend(node7);
  Assert.equal(
    escodegen(getResultNode(visit(node7.expression, {
      namespace,
      location: location7,
      file,
    }))),
    escodegen(node7.expression));
}
