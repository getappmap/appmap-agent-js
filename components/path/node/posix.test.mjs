import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";

import {
  getShell,
  toIpcPath,
  fromIpcPath,
  sanitizePathFilename,
  toDirectoryPath,
  toAbsolutePath,
  toRelativePath,
  getPathFilename,
} from "./posix.mjs";

// getShell //

assertDeepEqual(getShell({}), "/bin/sh");

assertDeepEqual(getShell({ SHELL: "/bin/bash" }), "/bin/bash");

// fromIpcPath && toIpcPath //

assertEqual(
  fromIpcPath(toIpcPath("/directory/filename")),
  "/directory/filename",
);

// sanitizePathFilename //

assertEqual(sanitizePathFilename(""), "...");

assertEqual(sanitizePathFilename("."), "....");

assertEqual(sanitizePathFilename(".."), ".....");

assertEqual(sanitizePathFilename("..."), "......");

assertEqual(sanitizePathFilename("foo/bar/qux"), "foo\\bar\\qux");

assertEqual(sanitizePathFilename("foo\\bar\\qux"), "foo\\\\bar\\\\qux");

// getPathFilename //

assertEqual(getPathFilename("/foo/bar/"), null);

assertEqual(getPathFilename("/foo/bar/qux"), "qux");

// toDirectoryPath //

assertEqual(toDirectoryPath("/foo/bar"), "/foo/bar/");

assertEqual(toDirectoryPath("/foo/bar/"), "/foo/bar/");

// toAbsolutePath && toRelativePath //

const test = (relative, base, path) => {
  assertEqual(toAbsolutePath(relative, base), path);
  assertEqual(toRelativePath(path, base), relative);
};

test("qux", "/foo/bar", "/foo/qux");

test("qux", "/foo/bar/", "/foo/bar/qux");

test("qux/", "/foo/bar/", "/foo/bar/qux/");

test(".", "/foo/bar/", "/foo/bar");
