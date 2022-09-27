import { mkdir as mkdirAsync, rm as rmAsync } from "fs/promises";

const { URL } = globalThis;

const { url } = import.meta;

await rmAsync(new URL("../dist", url), {
  force: true,
  recursive: true,
});

await mkdirAsync(new URL("../dist", url));

import("./component/index.mjs");

import("./schema/index.mjs");
