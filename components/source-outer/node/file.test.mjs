import {
  getFreshTemporaryURL,
  assert,
  assertDeepEqual,
} from "../../__fixture__.mjs";
import { writeFile as writeFileAsync } from "fs/promises";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import File from "./file.mjs";

const { readFile } = File(await buildTestDependenciesAsync(import.meta.url));
const { isLeft, makeRight } = await buildTestComponentAsync("util");

//////////
// data //
//////////

assertDeepEqual(
  readFile(
    `data:text/plain;charset=utf-8;base64,${Buffer.from("\n", "utf8").toString(
      "base64",
    )}`,
    "file:///path",
  ),
  makeRight({ url: "file:///path", content: "\n" }),
);

assertDeepEqual(
  readFile(`data:,${encodeURIComponent("\n")}`, "file:///path"),
  makeRight({ url: "file:///path", content: "\n" }),
);

//////////
// file //
//////////

const url = getFreshTemporaryURL();
assert(isLeft(readFile(url)));

await writeFileAsync(new URL(url), "foo", "utf8");
assertDeepEqual(
  readFile(url),
  makeRight({
    url,
    content: "foo",
  }),
);
assertDeepEqual(
  readFile(url),
  makeRight({
    url,
    content: "foo",
  }),
);

/////////////
// Invalid //
/////////////

assert(isLeft(readFile("http://localhost/foo")));
