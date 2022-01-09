const { stdout } = process;

for (const name of [
  "metadata",
  "classmap",
  "event-apply",
  "event-apply-source",
  "event-http",
  "event-query",
  "npx",
  "mocha",
]) {
  stdout.write(`${"\n"}${name}${"\n"}`);
  await import(`./${name}.mjs`);
}
