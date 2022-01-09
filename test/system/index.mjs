
const {stdout} = process;

for (const name of ["api", "cli"]) {
  stdout.write(`BEGIN ${name}${"\n"}`);
  await import(`./${name}/index.mjs`);
  stdout.write(`END ${name}${"\n"}${"\n"}`);
}
