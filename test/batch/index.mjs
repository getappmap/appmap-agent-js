
for (const name of ["metadata", "classmap", "event-apply", "event-http", "event-query", "local", "npx", "mocha"]) {
  process.stdout.write(`${"\n"}${name}${"\n"}`);
  await import(`./${name}.mjs`);
}
