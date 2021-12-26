import { assertEqual } from "../../__fixture__.mjs";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Platform from "./index.mjs";

const { getPathSeparator, isAbsolutePath, sanitizeFilename, getPathSplitter } =
  Platform(await buildTestDependenciesAsync(import.meta.url));

assertEqual(getPathSeparator(), "/");
assertEqual(getPathSplitter(), "/");
assertEqual(isAbsolutePath("/foo"), true);
assertEqual(isAbsolutePath("foo"), false);
assertEqual(sanitizeFilename("foo/bar\u0000", "_"), "foo_bar_");
