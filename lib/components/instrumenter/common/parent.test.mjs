import { strict as Assert } from "assert";
import { setParent, getParent } from "./parent.mjs";

const object1 = {};
const object2 = {};

setParent(object1, object2);

Assert.equal(getParent(object1), object2);
