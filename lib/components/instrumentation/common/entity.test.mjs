import { strict as Assert } from "assert";
import * as Acorn from "acorn";
import { setNodeIndex, setNodeCaption, setNodeParent } from "./node.mjs";
import { createClassEntity, createFunctionEntity } from "./entity.mjs";

const node = Acorn.parse("class c { static foo (x) {} }", {
  ecmaVersion: 2020,
  locations: true,
});

setNodeIndex(node.body[0], 123);
setNodeParent(node.body[0], node);
setNodeCaption(node.body[0], "foo");
Assert.deepEqual(createClassEntity(node.body[0], []), {
  type: "class",
  caption: "foo",
  children: [],
  index: 123,
});
/* eslint-disable no-undef */
setNodeIndex(node.body[0].body.body[0].value, 456);
setNodeParent(node.body[0].body.body[0].value, node.body[0].body.body[0]);
setNodeCaption(node.body[0].body.body[0].value, "bar");
const { loc, span, ...rest } = createFunctionEntity(
  node.body[0].body.body[0].value,
  [],
);
Assert.ok(Array.isArray(span));
Assert.ok(typeof loc === "object" && loc !== null);
Assert.deepEqual(rest, {
  type: "function",
  static: true,
  index: 456,
  caption: "bar",
  children: [],
  params: ["x"],
});
