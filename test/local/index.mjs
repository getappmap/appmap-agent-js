for (const name of [
  "metadata",
  "classmap",
  "event-apply",
  "event-http",
  "event-query",
  "npx",
  "mocha",
]) {
  process.stdout.write(`${"\n"}${name}${"\n"}`);
  await import(`./${name}.mjs`);
}
