
import { readFile, readdir } from "fs/promises";
import * as YAML from "yaml";
import home from "./home.mjs";

const {parse:parseYAML} = YAML;
const {parse:parseJSON, stringify:stringifyJSON} = JSON;
const default_cache = `${home}/build/architecture.json`;

export const loadArchitectureAsync = async (root) => {
  const architecture = {__proto__:null};
  for (const type of await readdir(root)) {
    architecture[type] = {__proto__:null};
    for (const name of await readdir(`${root}/${type}`)) {
      architecture[type][name] = parse(await readFile(`${root}/${type}/${name}/.deps.yml`));
    }
  }
  return architecture;
};

// export const cacheArchitectureAsync = (root, cache = default_cache) => {
//   const architecture = await loadArchitectureAsync(root);
//   await writeFile(cache, stringifyJSON(architecture, null, 2), "utf8");
// };
//
// export const loadCachedArchitectureAsync = async (cache = default_cache) => parseJSON(await readFile(cache, "utf8"));
