import { strict as Assert } from "assert";
import { parse, dive } from "./__fixture__.mjs";
import { buildAllAsync } from "../../../build.mjs";
import Entity from "./entity.mjs";

const mainAsync = async () => {
  const { makeEntity } = Entity(await buildAllAsync(["util"]));
  Assert.deepEqual(
    makeEntity(123, dive(parse(";"), ["body", "0"]), { name: "foo" }),
    {
      type: "EmptyStatement",
      index: 123,
      span: [0, 1],
      loc: undefined,
      info: { name: "foo" },
      caption: { origin: "EmptyStatement", name: null },
    },
  );
};

mainAsync();

//   const node = parse(, {
//     ecmaVersion: 2020,
//     locations: true,
//   });
//   const lineage = {
//     head:node.body[0],
//
// };
//
//
//
// setNodeIndex(node.body[0], 123);
// setNodeParent(node.body[0], node);
// setNodeCaption(node.body[0], "foo");
// Assert.deepEqual(makeClassEntity(node.body[0], []), {
//   type: "class",
//   caption: "foo",
//   children: [],
//   index: 123,
// });
// /* eslint-disable no-undef */
// setNodeIndex(node.body[0].body.body[0].value, 456);
// setNodeParent(node.body[0].body.body[0].value, node.body[0].body.body[0]);
// setNodeCaption(node.body[0].body.body[0].value, "bar");
// const { loc, span, ...rest } = makeFunctionEntity(
//   node.body[0].body.body[0].value,
//   [],
// );
// Assert.ok(Array.isArray(span));
// Assert.ok(typeof loc === "object" && loc !== null);
// Assert.deepEqual(rest, {
//   type: "function",
//   static: true,
//   index: 456,
//   caption: "bar",
//   children: [],
//   params: ["x"],
// });
//
// Assert.deepEqual(makePackageEntity("script", "filename.js", "123;", []), {
//   type: "package",
//   source_type: "script",
//   path: "filename.js",
//   code: "123;",
//   children: [],
// });
