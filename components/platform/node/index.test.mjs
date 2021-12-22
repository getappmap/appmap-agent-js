import { strict as Assert } from "assert";
import { buildTestDependenciesAsync } from "../../build.mjs";

const { equal: assertEqual } = Assert;

import OperatingSystem from "os";
let platform = null;
OperatingSystem.platform = () => platform;

const { default: Platform } = await import("./index.mjs");

{
  platform = "win32";
  const { getPathSeparator, isAbsolutePath, sanitizeFilename } = Platform(
    await buildTestDependenciesAsync(import.meta.url),
  );
  assertEqual(getPathSeparator(), "\\");
  assertEqual(isAbsolutePath("C:\\foo"), true);
  assertEqual(isAbsolutePath("foo"), false);
  assertEqual(sanitizeFilename("foo/bar\\qux\u0000", "_"), "foo_bar_qux_");
}

{
  platform = "darwin";
  const { getPathSeparator, isAbsolutePath, sanitizeFilename } = Platform(
    await buildTestDependenciesAsync(import.meta.url),
  );
  assertEqual(getPathSeparator(), "/");
  assertEqual(isAbsolutePath("/foo"), true);
  assertEqual(isAbsolutePath("foo"), false);
  assertEqual(sanitizeFilename("foo/bar\u0000", "_"), "foo_bar_");
}
