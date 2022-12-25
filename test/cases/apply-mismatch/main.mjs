import { strict as Assert } from "node:assert";
const { undefined } = globalThis;
const { deepEqual: assertDeepEqual } = Assert;
const pairup = (x, y) => [x, y];
assertDeepEqual(pairup(123, 456, 789), [123, 456]);
assertDeepEqual(pairup(123), [123, undefined]);
