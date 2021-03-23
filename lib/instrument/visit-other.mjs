
import {combineResult} from "./result.mjs";
import {assignVisitorObject, getVisitorObject} from "./visit.mjs";

const makeIdentifier = (node) => ({
  type: "Identifier",
  name: node.name
});

const makeLiteral = (node) => {
  if (
    typeof node.value === 'string' &&
    Reflect.getOwnPropertyDescriptor(node, 'regex') === undefined &&
    Reflect.getOwnPropertyDescriptor(node, 'bigint') === undefined)
  ) {
    return {
      type: 'Literal',
      value: node.value,
    };
  }
  throw new Error(`Invalid string literal`);
};

assignVisitorObject("ScopingIdentifier", {
  Identifier: (node, location) => {
    location.getNamespace().checkIdentifierCollision(node.name);
    return combineResult(makeIdentifier, node);
  }
});

assignVisitorObject("SpreadElement", {});

assignVisitorObject("NoneScopingIdentifier", {
  Identifier: (node, location) => combineResult(makeIdentifier, node)
});

assignVisitorObject("StringLiteral", {
  Literal: (node, location) => combineResult(makeLiteral, node)
});

assignVisitorObject("NonComputedKey", {
  Identifier: getVisitorObject("NoneScopingIdentifier").Identifier,
  Literal: getVisitorObject("StringLiteral").Literal
});
