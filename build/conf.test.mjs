import { strict as Assert } from "assert";
import { writeFile } from "fs/promises";
import { tmpdir } from "os";
import { loadConfAsync } from "./conf.mjs";
const { equal: assertEqual, deepEqual: assertDeepEqual } = Assert;

const { random } = Math;

global.EXPECT_TEST = null;

const path = `${tmpdir()}/${random().toString(36).substring(2)}`;

try {
  await loadConfAsync(path);
} catch ({ message }) {
  assertEqual(message, "Expection failure");
}

await writeFile(
  path,
  ["branches: [foo, foo]", "dependencies: []"].join("\n"),
  "utf8",
);

try {
  await loadConfAsync(path);
} catch ({ message }) {
  assertEqual(message, "Expection failure");
}

await writeFile(
  path,
  ["branches: [foo, bar]", "dependencies: [qux, baz]"].join("\n"),
  "utf8",
);

assertDeepEqual(await loadConfAsync(path), {
  branches: ["foo", "bar"],
  dependencies: ["qux", "baz"],
});
