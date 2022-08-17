import { loadAsync } from "../../../build/await/load.mjs";

const { stdout } = process;

for (const name of [
  "metadata",
  "classmap",
  "eval",
  "event-apply",
  "event-apply-source",
  "event-http",
  "event-query",
  "npx",
  "mocha",
  "remote",
]) {
  stdout.write(`${"\n"}${name}${"\n"}`);
  await loadAsync(import(`./${name}.mjs`));
}
