import { readFileSync } from "fs";
import { readFile as readFileAsync } from "fs/promises";

const { URL } = globalThis;

export default (_dependencies) => ({
  readFileAsync: async (url) => readFileAsync(new URL(url), "utf8"),
  readFileSync: (url) => readFileSync(new URL(url), "utf8"),
});
