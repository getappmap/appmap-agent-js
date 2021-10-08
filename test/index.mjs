const { stdout } = process;

for (const name of ["local", "remote", "manual"]) {
  stdout.write(`BEGIN ${name}...${"\n"}`);
  await import(`./${name}/index.mjs`);
  stdout.write(`END ${name}${"\n"}`);
}
