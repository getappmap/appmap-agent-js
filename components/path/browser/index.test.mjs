import { assertEqual, assertThrow } from "../../__fixture__.mjs";
import {
  encodeSegment,
  joinPath,
  splitPath,
  getShell,
} from "./index.mjs?env=test";

assertThrow(() => getShell({}));
assertThrow(() => encodeSegment("foo\\bar"));
assertThrow(() => encodeSegment("foo/bar"));
assertThrow(() => encodeSegment("foo%%bar"));
encodeSegment("foo%20bar");
assertThrow(() => splitPath("foo/bar"));
assertEqual(joinPath(splitPath("/foo/bar/qux")), "/foo/bar/qux");
