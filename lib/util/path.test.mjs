import { strict as Assert } from "assert";
import { makeRelativePath } from "./path.mjs";

Assert.deepEqual(
  getRelativePath("/foo/bar1", "/foo/bar2/qux/buz/.."),
  "../bar2/qux",
);
