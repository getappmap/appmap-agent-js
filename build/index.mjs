import { mkdir as mkdirAsync, rm as rmAsync } from "fs/promises";
import { loadAsync } from "./await/load.mjs";

await rmAsync("./dist", { force: true, recursive: true });
await mkdirAsync("./dist");

await loadAsync(import("./schema/index.mjs"));
await loadAsync(import("./component/index.mjs"));
