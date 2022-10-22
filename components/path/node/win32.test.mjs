import {
  assertEqual,
  assertDeepEqual,
  assertThrow,
} from "../../__fixture__.mjs";

import {
  getShell,
  toIpcPath,
  fromIpcPath,
  sanitizePathFilename,
  getPathFilename,
  toDirectoryPath,
  toAbsolutePath,
  toRelativePath,
} from "./win32.mjs?env=test";

// getShell //

assertDeepEqual(getShell({}), "cmd.exe");

assertDeepEqual(getShell({ COMSPEC: "powershell" }), "powershell");

// fromIpcPath && toIpcPath //

assertEqual(
  fromIpcPath(toIpcPath("c:\\directory\\filename")),
  "c:\\directory\\filename",
);

assertThrow(() => {
  fromIpcPath("c:\\directory\\filename");
}, /^Error: not an ipc path/u);

assertEqual(sanitizePathFilename(""), "__");

assertEqual(sanitizePathFilename("foo."), "_foo._");

assertEqual(sanitizePathFilename("foo "), "_foo _");

assertEqual(sanitizePathFilename("CON.EXT"), "_CON.EXT_");

assertEqual(sanitizePathFilename("foo/bar/qux"), "foo-bar-qux");

assertEqual(sanitizePathFilename("foo\\bar\\qux"), "foo-bar-qux");

// getPathFilename //

assertEqual(getPathFilename("c:"), null);

assertEqual(getPathFilename("c:\\foo\\bar\\"), null);

assertEqual(getPathFilename("c:\\foo\\bar\\qux"), "qux");

// toDirectoryPath //

assertEqual(toDirectoryPath("c:\\foo\\bar"), "c:\\foo\\bar\\");

assertEqual(toDirectoryPath("c:\\foo\\bar\\"), "c:\\foo\\bar\\");

// toAbsolutePath && toRelativePath //

const test = (relative, base, path) => {
  assertEqual(toAbsolutePath(relative, base), path);
  assertEqual(toRelativePath(path, base), relative);
};

test("qux", "c:\\foo\\bar", "c:\\foo\\qux");

test("qux", "c:\\foo\\bar\\", "c:\\foo\\bar\\qux");

test("qux\\", "c:\\foo\\bar\\", "c:\\foo\\bar\\qux\\");

test(".", "c:\\foo\\bar\\", "c:\\foo\\bar");
