import { readFileSync as readFile } from "fs";
import { readFile as readFileAsync } from "fs/promises";
import { URL } from "url";

const _URL = URL;

export default (dependencies) => {
  return {
    readFileAsync: async (url) => {
      return await readFileAsync(new _URL(url), "utf8");
    },
    readFile: (url) => {
      return readFile(new _URL(url), "utf8");
    },
  };
};
