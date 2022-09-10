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

const { Buffer, encodeURIComponent, URL } = globalThis;

const { readFileSync } = File(
  await buildTestDependenciesAsync(import.meta.url),
);
const { isLeft, makeRight } = await buildTestComponentAsync("util");

//////////
// data //
//////////

assertDeepEqual(
  readFileSync(
    `data:text/plain;charset=utf-8;base64,${Buffer.from("\n", "utf8").toString(
      "base64",
    )}`,
    "file:///path",
  ),
  makeRight({ url: "file:///path", content: "\n" }),
);

assertDeepEqual(
  readFileSync(`data:,${encodeURIComponent("\n")}`, "file:///path"),
  makeRight({ url: "file:///path", content: "\n" }),
);

//////////
// file //
//////////

const url = getFreshTemporaryURL();
assert(isLeft(readFileSync(url)));

await writeFileAsync(new URL(url), "foo", "utf8");
assertDeepEqual(
  readFileSync(url),
  makeRight({
    url,
    content: "foo",
  }),
);
assertDeepEqual(
  readFileSync(url),
  makeRight({
    url,
    content: "foo",
  }),
);

/////////////
// Invalid //
/////////////

assert(isLeft(readFileSync("http://localhost/foo")));
