import { strict as Assert } from 'assert';
import * as Acorn from 'acorn';
import * as Escodegen from 'escodegen';
import {Counter} from "../../../util/index.mjs";
import {visit} from "./visit.mjs";

Error.stackTraceLimit = Infinity;

export const test = (input, options) => {
  options = {
    type: "script",
    output: input,
    runtime: "$",
    exclude: () => false,
    counter: new Counter(),
    entities: [],
    ...options
  };
  const parser_options = {
    sourceType: options.type,
    ecmaVersion: 2020,
    locations: true
  };
  const { node, entities } = visit(
    Acorn.parse(input, parser_options),
    {
      exclude: options.exclude,
      runtime: options.runtime,
      counter: options.counter,
    },
    null,
  );
  Assert.equal(Escodegen.generate(node), Escodegen.generate(Acorn.parse(options.output, parser_options)));
  if (options.entities === null) {
    return entities;
  }
  Assert.deepEqual(entities, options.entities);
  return null;
};
