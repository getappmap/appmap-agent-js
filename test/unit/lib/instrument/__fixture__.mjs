import { strict as Assert } from 'assert';
import { parse as acorn } from 'acorn';
import { generate as escodegen } from 'escodegen';

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