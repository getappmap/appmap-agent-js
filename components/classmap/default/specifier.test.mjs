import {
  assertEqual,
  assertDeepEqual,
  assertThrow,
} from "../../__fixture__.mjs";
import {
  toSpecifier,
  splitSpecifier,
  splitSpecifierDirectory,
} from "./specifier.mjs";

// toSpecifier //

assertEqual(
  toSpecifier("protocol://host/base/file", "protocol://host/base/"),
  "./file",
);

assertEqual(
  toSpecifier("protocol://host/base1/file", "protocol://host/base1/base2/"),
  "../file",
);

assertEqual(
  toSpecifier("protocol1://host1/file", "protocol2://host2/base/"),
  "protocol1://host1/file",
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
