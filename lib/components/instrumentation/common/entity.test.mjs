import { strict as Assert } from "assert";
import { setNodeIndex, setNodeCaption } from "./node.mjs";
import { createClassEntity, createFunctionEntity } from "./entity.mjs";

const node = {};

setNodeCaption(node, "foo");
setNodeIndex(node, 123);

Assert.equal(createClassEntity(node).caption, "foo");

Assert.equal(createClassEntity(node).index, 123);

Assert.equal(createFunctionEntity(node, true).static, true);
