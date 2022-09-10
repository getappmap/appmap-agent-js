import { readFileSync } from "fs";
import { readFile as readFileAsync } from "fs/promises";

const { URL } = globalThis;

export default (_dependencies) => {
  return {
    readFileAsync: async (url) => {
      return await readFileAsync(new URL(url), "utf8");
    },
    readFileSync: (url) => {
      return readFileSync(new URL(url), "utf8");
    },
  };
};
