
import {mkdir, readFile, writeFile} from "fs/promises";
import {setupAsync} from "./setup.mjs";

const testAsync = async () => {
  await setupAsync(
    "simple",
    "0.0.0",
    {
      enabled: true,
      protocol: "inline",
      children: [["node", "main.mjs"]],
      packages: [{regexp:"^"}],
      output: {
        postfix: ".postfix",
        directory: "output-directory",
        filename: "output-filename",
      },
    },
    async (repository) => {
      await writeFile(`${repository}/main.mjs`, "function f () {}; f(123);");
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
