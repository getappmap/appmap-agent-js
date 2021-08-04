
import {writeFile} from "fs/promises";
import {setupAsync} from "./setup.mjs";

const testAsync = () => {
  await setupAsync(
    "simple",
    "0.0.0",
    async (repository) => {
      await writeFile(`${repository}/main.mjs`, "function f () {}; f(123);");
      return {
        enabled: true,
        children: [["node", "main.mjs"]],
        packages: [{regexp:"^"}],
        output: {
          postfix: ".postfix",
          directory: "output-directory",
          filename: "output-filename",
        },
      };
    },
    async (respository) => {
      console.log(
        await readFile(`${repository}/output-directory/output-filename.postfix.json`, "utf8")
      );
    },
  );
};

testAsync();
