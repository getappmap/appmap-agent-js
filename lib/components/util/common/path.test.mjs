import { strict as Assert } from "assert";
import { getRelativePath } from "./path.mjs";

Assert.deepEqual(
  getRelativePath("/foo/bar1", "/foo/bar2/qux/buz/.."),
  "../bar2/qux",
);
