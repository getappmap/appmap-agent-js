import { strict as Assert } from "assert";
import { setNodeParent, getNodeParent } from "./node.mjs";

const object1 = {};
const object2 = {};

setNodeParent(object1, object2);

Assert.equal(getNodeParent(object1), object2);
