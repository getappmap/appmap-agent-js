import { strict as Assert } from "assert";
import { buildTestAsync } from "../../../build/index.mjs";
import { parse, generate } from "./__fixture__.mjs";
import Visit from "./visit.mjs";

const testAsync = async () => {
  const dependencies = await buildTestAsync(import.meta);
  const {
    util: { createCounter },
  } = dependencies;
  const { visit } = Visit(dependencies);
  const compareEntities = (entities, entities2) => {
    Assert.equal(entities.length, entities2.length);
    const { length } = entities;
    for (let index = 0; index < length; index += 1) {
      compareEntity(entities[index], entities2[index]);
    }
  };
  const compareEntity = (
    { outline: { span: span1, loc: loc1, ...rest1 }, children: children1 },
    { outline: { span: span2, loc: loc2, ...rest2 }, children: children2 },
  ) => {
    Assert.deepEqual(rest1, rest2);
    compareEntities(children1, children2);
  };
  const test = (input, expected, options) => {
    const { kind, output } = {
      kind: "script",
      output: input,
      ...options,
    };
    const { node, entities } = visit(parse(input), {
      counter: createCounter(0),
      runtime: "$",
      path: "path",
      exclude: new Set(["exclude"]),
    });
    Assert.equal(generate(node), generate(parse(output, kind)));
    compareEntities(entities, expected);
  };

  test(";", []);
  test("({exclude:{}});", [
    {
      outline: {
        index: 1,
        type: "ObjectExpression",
        info: { name: null },
        caption: { origin: null, name: null },
      },
      children: [],
    },
  ]);
  test("function exclude () {}", []);
};

testAsync();
