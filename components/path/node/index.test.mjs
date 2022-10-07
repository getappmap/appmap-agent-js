import {
  assertEqual,
  assertThrow,
  assertDeepEqual,
} from "../../__fixture__.mjs";
import { platform as getPlatform } from "os";
import {
  getShell,
  toIPCPath,
  fromIPCPath,
  makeSegment,
  encodeSegment,
  decodeSegment,
  joinPath,
  splitPath,
  isAbsolutePath,
} from "./index.mjs?env=test";

if (getPlatform() === "win32") {
  assertDeepEqual(getShell({}), ["cmd.exe", "/c"]);
  assertDeepEqual(getShell({ comspec: "powershell.exe" }), [
    "powershell.exe",
    "-c",
  ]);
  assertEqual(fromIPCPath(toIPCPath("C:\\foo")), "C:\\foo");
  assertEqual(makeSegment("foo\\bar/qux", "-"), "foo-bar-qux");
  assertThrow(() => encodeSegment("foo\\bar"));
  assertThrow(() => encodeSegment("foo/bar"));
  assertEqual(decodeSegment(encodeSegment("foo#bar")), "foo#bar");
  assertEqual(joinPath(splitPath("foo\\bar/qux")), "foo\\bar\\qux");
  assertEqual(isAbsolutePath("C:\\foo"), true);
  assertEqual(isAbsolutePath("\\\\foo"), true);
  assertEqual(isAbsolutePath("foo"), false);
} else {
  assertDeepEqual(getShell({}), ["/bin/sh", "-c"]);
  assertEqual(fromIPCPath(toIPCPath("/foo")), "/foo");
  assertEqual(makeSegment("foo\\bar/qux", "-"), "foo\\bar-qux");
  assertThrow(() => encodeSegment("foo/bar"));
  assertEqual(decodeSegment(encodeSegment("foo\\bar")), "foo\\bar");
  assertEqual(joinPath(splitPath("foo\\bar/qux")), "foo\\bar/qux");
  assertEqual(isAbsolutePath("/foo"), true);
  assertEqual(isAbsolutePath("foo"), false);
}
