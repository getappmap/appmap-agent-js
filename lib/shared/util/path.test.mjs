import {strict: Assert} from "assert";
import {makeRelativePath} from "./path.js";

Assert.equal(
  makeRelativePath("/foo/bar1", "/foo/bar2/qux/buz/.."),
  "../bar2/qux"
);
