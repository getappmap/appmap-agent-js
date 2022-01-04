import { strict as Assert } from "assert";
import { tmpdir } from "os";
import { writeFile as writeFileAsync } from "fs/promises";
import { join as joinPath } from "path";
import { pathToFileURL } from "url";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import File from "./file.mjs";

const { deepEqual: assertDeepEqual, ok: assert } = Assert;

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

const path = joinPath(tmpdir(), Math.random().toString(36).substring(2));
const url = pathToFileURL(path).toString();
assert(isLeft(readFile(url)));

await writeFileAsync(path, "foo", "utf8");
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
