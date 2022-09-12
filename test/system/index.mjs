import { loadAsync } from "../../build/await/load.mjs";

const {
  process: { stdout },
} = globalThis;

for (const name of ["api", "cli", "npm"]) {
  stdout.write(`BEGIN ${name}${"\n"}`);
  await loadAsync(import(`./${name}/index.mjs`));
  stdout.write(`END ${name}${"\n"}${"\n"}`);
}
