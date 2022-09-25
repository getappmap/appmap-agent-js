const {
  process: { stdout },
} = globalThis;

for (const name of ["api", "cli", "npm"]) {
  stdout.write(`BEGIN ${name}${"\n"}`);
  await import(`./${name}/index.mjs`);
  stdout.write(`END ${name}${"\n"}${"\n"}`);
}
