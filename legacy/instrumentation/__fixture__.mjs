import { strict as Assert } from "assert";
import * as Acorn from "acorn";
import * as Escodegen from "escodegen";
// import { createCounter } from "../../../util/index.mjs";
// import { visit } from "./visit.mjs";

Error.stackTraceLimit = Infinity;

export const parse = (code, kind = "script") =>
  Acorn.parse(code, { ecmaVersion: 2020, sourceType: kind, locations: true });

export const generate = Escodegen.generate;

export const fetch = (node, keys) => {
  for (const key of keys) {
    node = node[key];
  }
  return node;
};

export const dive = (node, keys) => {
  let lineage = { head: node, tail: null };
  for (const key of keys) {
    node = node[key];
    if (!Array.isArray(node)) {
      lineage = { head: node, tail: lineage };
    }
  }
  return lineage;
};

export const testVisitor = (input, keys, visitors, options) => {
  const { kind, info, output, context, outline } = {
    kind: "script",
    info: null,
    output: input,
    context: null,
    outline: null,
    ...options,
  };
  const lineage = dive(parse(input, kind), keys);
  const { head: node } = lineage;
  const { type } = node;
  if (Reflect.getOwnPropertyDescriptor(visitors, type) === undefined) {
    throw new Error(
      `got ${JSON.stringify(type)}, expected one of ${JSON.stringify(
        Reflect.ownKeys(visitors),
      )}`,
    );
  }
  const { [type]: visitor } = visitors;
  const { extract, dismantle, assemble, sieve } = {
    extract: null,
    dismantle: () => null,
    assemble: (node) => node,
    sieve: null,
    ...visitor,
  };
  if (extract !== null) {
    Assert.deepEqual(extract(lineage, context), info);
  }
  Assert.equal(
    generate(fetch(parse(output, kind), keys)),
    generate(assemble(node, dismantle(node), context, outline)),
  );
  return sieve;
};
