import { assertDeepEqual } from "../../__fixture__.mjs";
import { zip } from "./array.mjs";

assertDeepEqual(zip(["foo1", "bar1", "qux1"], ["foo2", "bar2"], "QUX2"), [
  ["foo1", "foo2"],
  ["bar1", "bar2"],
  ["qux1", "QUX2"],
]);
