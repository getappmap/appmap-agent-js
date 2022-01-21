import { loadAsync } from "../../build/await/load.mjs";
const { stdout } = process;

for (const name of ["api", "cli", "npm"]) {
  stdout.write(`BEGIN ${name}${"\n"}`);
  await loadAsync(import(`./${name}/index.mjs`));
  stdout.write(`END ${name}${"\n"}${"\n"}`);
}
