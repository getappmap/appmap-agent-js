import { strict as Assert } from "node:assert";
const { deepEqual: assertDeepEqual } = Assert;
const toObject = ([x1, x2]) => ({ x1, x2 });
assertDeepEqual(toObject([123, 456]), { x1: 123, x2: 456 });
