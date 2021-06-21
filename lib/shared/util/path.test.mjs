import {strict as Assert} from "assert";
import {makeRelativePath} from "./path.mjs";

Assert.equal(
  makeRelativePath("/foo/bar1", "/foo/bar2/qux/buz/.."),
  "../bar2/qux"
);
