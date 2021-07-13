import { strict as Assert } from "assert";
import * as Acorn from "acorn";
import * as Escodegen from "escodegen";
import { createCounter } from "../../../util/index.mjs";
import { visit } from "./visit.mjs";

Error.stackTraceLimit = Infinity;

export const test = (input, options) => {
  const {
    type,
    output,
    entities: entities1,
    ...visit_options
  } = {
    type: "script",
    output: input,
    entities: [],
    path: "filename.js",
    runtime: "$",
    exclude: new Set(),
    counter: createCounter(),
    ...options,
  };
  const parse_options = {
    sourceType: type,
    ecmaVersion: 2020,
    locations: true,
  };
  const { node, entities: entities2 } = visit(
    Acorn.parse(input, parse_options),
    visit_options,
    null,
  );
  Assert.equal(
    Escodegen.generate(node),
    Escodegen.generate(Acorn.parse(output, parse_options)),
  );
  if (entities1 === null) {
    return entities2;
  }
  Assert.deepEqual(entities2, entities1);
  return null;
};
