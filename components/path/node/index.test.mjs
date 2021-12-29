import { assertEqual, assertThrow } from "../../__fixture__.mjs";
import { buildTestDependenciesAsync } from "../../build.mjs";

import OperatingSystem from "os";
let platform = null;
OperatingSystem.platform = () => platform;

const { default: Path } = await import("./index.mjs");

{
  platform = "win32";
  const {
    makeSegment,
    encodeSegment,
    decodeSegment,
    joinPath,
    splitPath,
    isAbsolutePath,
  } = Path(await buildTestDependenciesAsync(import.meta.url));
  assertEqual(makeSegment("foo\\bar/qux", "-"), "foo-bar-qux");
  assertThrow(() => encodeSegment("foo\\bar"));
  assertThrow(() => encodeSegment("foo/bar"));
  assertEqual(decodeSegment(encodeSegment("foo#bar")), "foo#bar");
  assertEqual(joinPath(splitPath("foo\\bar/qux")), "foo\\bar\\qux");
  assertEqual(isAbsolutePath("C:\\foo"), true);
  assertEqual(isAbsolutePath("\\\\foo"), true);
  assertEqual(isAbsolutePath("foo"), false);
}

{
  platform = "darwin";
  const {
    makeSegment,
    encodeSegment,
    decodeSegment,
    joinPath,
    splitPath,
    isAbsolutePath,
  } = Path(await buildTestDependenciesAsync(import.meta.url));
  assertEqual(makeSegment("foo\\bar/qux", "-"), "foo\\bar-qux");
  assertThrow(() => encodeSegment("foo/bar"));
  assertEqual(decodeSegment(encodeSegment("foo\\bar")), "foo\\bar");
  assertEqual(joinPath(splitPath("foo\\bar/qux")), "foo\\bar/qux");
  assertEqual(isAbsolutePath("/foo"), true);
  assertEqual(isAbsolutePath("foo"), false);
}
