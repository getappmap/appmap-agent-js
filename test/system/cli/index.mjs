const { process } = globalThis;

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
  // "remote",
]) {
  stdout.write(`${"\n"}${name}${"\n"}`);
  await import(`./${name}.mjs`);
}
