import {
  readFile as readFileAsync,
  writeFile as writeFileAsync,
} from "node:fs/promises";
import { getParamsUrl } from "./layout.mjs";

const {
  Error,
  eval: geval,
  JSON: { stringify: stringifyJSON },
} = globalThis;

// JSON modules would be nice to hold parameters...
// But they are not yet consistently supported across major node versions.

export const writeParamsAsync = async (home, params) => {
  await writeFileAsync(
    getParamsUrl(home),
    `export default ${stringifyJSON(params, null, 2)};`,
    "utf8",
  );
};

export const readParamsAsync = async (home) => {
  // Not using import to bypass module cache.
  const content = await readFileAsync(getParamsUrl(home), "utf8");
  const parts = /^\s*export\s+default([^;]*);\s*$/u.exec(content);
  if (parts === null) {
    throw new Error("failed to parse params file");
  } else {
    return geval(`(${parts[1]});`);
  }
};
