import { strict as Assert } from "node:assert";
const { deepEqual: assertDeepEqual } = Assert;
const rest = (x, ...xs) => ({ x, xs });
assertDeepEqual(rest(123, 456, 789), { x: 123, xs: [456, 789] });
