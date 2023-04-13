import {
  assertEqual,
  assertDeepEqual,
  assertThrow,
} from "../../../__fixture__.mjs";
import {
  toStaticSpecifier,
  toDynamicSpecifier,
  splitSpecifier,
  splitSpecifierDirectory,
} from "./specifier.mjs";

// toStaticSpecifier //

assertEqual(
  toStaticSpecifier(
    "protocol://host/base/file?key=val#hash",
    "protocol://host/base/",
  ),
  "./file?key=val",
);

assertEqual(
  toStaticSpecifier(
    "protocol://host/base1/file?key=val#hash",
    "protocol://host/base1/base2/",
  ),
  "../file?key=val",
);

assertEqual(
  toStaticSpecifier(
    "protocol1://host1/file?key=val#hash",
    "protocol2://host2/base/",
  ),
  "protocol1://host1/file?key=val",
);

// toDynamicSpecifier //

assertEqual(
  toDynamicSpecifier(
    "protocol://host/base/file?key=val#hash",
    "protocol://host/base/",
    "version",
  ),
  "./file?key=val#version",
);

// splitSpecifier //

assertDeepEqual(splitSpecifier("./file"), [".", "file"]);

assertDeepEqual(splitSpecifier("../file"), ["..", "file"]);

assertDeepEqual(
  splitSpecifier("protocol://user:pass@host:8080/dir/file?key=val#hash"),
  ["protocol://host:8080", "dir", "file?key=val#hash"],
);

assertThrow(
  () => splitSpecifier("invalid-specifier"),
  /^InternalAppmapError: invalid specifier$/u,
);

// splitSpecifierDirectory //

assertDeepEqual(splitSpecifierDirectory("./file"), ["."]);

assertDeepEqual(splitSpecifierDirectory("./directory/file"), ["directory"]);

assertDeepEqual(splitSpecifierDirectory("../file"), [".."]);

assertDeepEqual(splitSpecifierDirectory("../directory/file"), [
  "..",
  "directory",
]);

assertDeepEqual(splitSpecifierDirectory("protocol://host/directory/file"), [
  "protocol://host",
  "directory",
]);
