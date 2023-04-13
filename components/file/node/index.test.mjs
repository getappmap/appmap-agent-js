import { writeFile as writeFileAsync } from "node:fs/promises";
import { assertEqual, assertThrow } from "../../__fixture__.mjs";
import { toAbsoluteUrl } from "../../url/index.mjs";
import { getUuid } from "../../uuid/random/index.mjs";
import { getTmpUrl } from "../../path/index.mjs";
import { readFile } from "./index.mjs";

const { URL } = globalThis;

{
  const url = toAbsoluteUrl(getUuid(), getTmpUrl());
  await writeFileAsync(new URL(url), "content", "utf8");
  assertEqual(readFile(url), "content");
}

assertEqual(readFile("data:,Hello%2C%20World%21"), "Hello, World!");

assertEqual(
  readFile("data:text/plain;base64,SGVsbG8sIFdvcmxkIQ=="),
  "Hello, World!",
);

assertThrow(() => readFile("http://locahost/"), /Error: unsupported protocol/u);
