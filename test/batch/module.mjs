
import {mkdir, readFile, writeFile} from "fs/promises";
import {setupAsync} from "./setup.mjs";

const testAsync = async () => {
  await setupAsync(
    "simple",
    "0.0.0",
    {
      enabled: true,
      protocol: "inline",
      children: [["node", "./main.mjs"]],
      packages: [{regexp:"^"}],
      hooks: {
        cjs: true,
        esm: true,
      },
      output: {
        postfix: ".postfix",
        directory: "output-directory",
        filename: "output-filename",
        indent: 2,
      },
    },
    async (repository) => {
      await writeFile(
        `${repository}/main.mjs`,
        `import "./module.js"`,
        "utf8"
      );
      await writeFile(
        `${repository}/module.js`,
        ``,
        "utf8"
      );
      await mkdir(`${repository}/output-directory`);
    },
    async (repository) => {
      console.log(
        await readFile(`${repository}/output-directory/output-filename.postfix.json`, "utf8")
      );
    },
  );
};

testAsync();
