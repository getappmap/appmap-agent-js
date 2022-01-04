import { mkdir as mkdirAsync, rm as rmAsync } from "fs/promises";

await rmAsync("./dist", { force: true, recursive: true });
await mkdirAsync("./dist");

await Promise.all([
  import("./schema/index.mjs"),
  import("./component/index.mjs"),
]);
