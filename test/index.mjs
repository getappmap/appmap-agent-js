const { stdout } = process;

const testAsync = async (name) => {
  stdout.write(`BEGIN ${name}...${"\n"}`);
  await import(`./${name}/index.mjs`);
  stdout.write(`END ${name}${"\n"}`);
};

await testAsync("local");
await testAsync("manual");
await testAsync("remote");
