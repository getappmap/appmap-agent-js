import { strict as Assert } from "assert";
import { setNodeIndex, setNodeCaption } from "./node.mjs";
import { makeClassEntity, makeFunctionEntity } from "./entity.mjs";

const node = {};

setNodeCaption(node, "foo");
setNodeIndex(node, 123);

Assert.equal(makeClassEntity(node).caption, "foo");

Assert.equal(makeClassEntity(node).index, 123);

Assert.equal(makeFunctionEntity(node, true).static, true);
