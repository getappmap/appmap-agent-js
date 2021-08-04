
import {mkdir, readFile, writeFile} from "fs/promises";
import {setupAsync} from "./setup.mjs";

const testAsync = async () => {
  await setupAsync(
    "simple",
    "0.0.0",
    {
      enabled: true,
      protocol: "inline",
      children: [["node", "./foo.js"]],
      packages: [{regexp:"^"}],
      hooks: {
        cjs: true,
        esm: true,
        apply: true,
        group: true,
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
        `${repository}/foo.js`,
        `
          function g (arg) {
            console.log(arg);
          }
          function f (arg) {
            console.log(arg)
            setTimeout(g, 456);
          }
          f(123);
        `,
        "utf8"
      );
      // await writeFile(
      //   `${repository}/bar.js`,
      //   `
      //     function bar (arg) {
      //       console.log('bar', arg);
      //     }
      //     bar(456);
      //   `,
      //   "utf8"
      // );
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
