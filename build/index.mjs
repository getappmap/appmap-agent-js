import {
  mkdir as mkdirAsync,
  rmdir as rmdirAsync,
  readdir as readdirAsync,
} from "fs/promises";
import { loadAsync } from "./await/load.mjs";

const isDirectoryPresentAsync = async (path) => {
  try {
    await readdirAsync(path);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      return false;
    } else {
      throw error;
    }
  }
};

if (await isDirectoryPresentAsync("./dist")) {
  await rmdirAsync("./dist", { recursive: true });
}

await mkdirAsync("./dist");

await loadAsync(import("./schema/index.mjs"));
await loadAsync(import("./component/index.mjs"));
