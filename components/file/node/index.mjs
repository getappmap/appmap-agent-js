import { readFileSync as readFile } from "fs";
import { readFile as readFileAsync } from "fs/promises";
import { URL } from "url";

export default (dependencies) => {
  return {
    readFileAsync: async (url) => {
      return await readFileAsync(new URL(url), "utf8");
    },
    readFile: (url) => {
      return readFile(new URL(url), "utf8");
    },
  };
};
