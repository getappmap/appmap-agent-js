
import {strict as Assert}  from "assert";
import {check, checkSuccess, checkDeadcode} from "./check.mjs";

Assert.throws(
  () => check(Error)(false, "foo %s", "bar"),
  new Error("foo bar")
);

Assert.throws(
  () => checkSuccess(Error)(() => { throw new TypeError("qux") }, "foo %s %s", "bar"),
  new Error("foo bar qux")
);

Assert.throws(
  () => checkDeadcode(Error)("foo %s %s", "bar")(new TypeError("qux")),
  new Error("foo bar qux")
);
