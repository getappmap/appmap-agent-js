import { strict as Assert } from "assert";
import { zip } from "./array.mjs";

const {
  deepEqual: assertDeepEqual,
  // equal: assertEqual,
  // fail: assertFail
} = Assert;

// zip //

assertDeepEqual(zip(["foo1", "bar1", "qux1"], ["foo2", "bar2"], "QUX2"), [
  ["foo1", "foo2"],
  ["bar1", "bar2"],
  ["qux1", "QUX2"],
]);
