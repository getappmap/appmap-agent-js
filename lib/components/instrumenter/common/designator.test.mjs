import * as Acorn from "acorn";

import { strict as Assert } from "assert";

import { Counter } from "../../../util/index.mjs";

import { makeDesignator } from "./designator.mjs";

const test = (code, path) => {
  let node = Acorn.parse(code, { ecmaVersion: 2020 });
  let list = null;
  for (const segment of path) {
    list = { head: node, tail: list };
    node = node[segment];
  }
  return makeDesignator(node, list, new Counter());
};

Assert.equal(test(";", []), null);
Assert.deepEqual(test("x = {};", ["body", "0", "expression", "right"]), {
  name: "x",
  bound: false,
  index: 1,
});
