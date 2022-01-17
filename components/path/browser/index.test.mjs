import { assertEqual, assertThrow } from "../../__fixture__.mjs";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Path from "./index.mjs";

const { encodeSegment, joinPath, splitPath, getShell } = Path(
  await buildTestDependenciesAsync(import.meta.url),
);
assertThrow(() => getShell({}));
assertThrow(() => encodeSegment("foo\\bar"));
assertThrow(() => encodeSegment("foo/bar"));
assertThrow(() => encodeSegment("foo%%bar"));
encodeSegment("foo%20bar");
assertThrow(() => splitPath("foo/bar"));
assertEqual(joinPath(splitPath("/foo/bar/qux")), "/foo/bar/qux");
