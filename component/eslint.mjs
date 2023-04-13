import { writeFile as writeFileAsync } from "node:fs/promises";
import {
  getInstanceEslintUrl,
  readInstanceArrayAsync,
  readComponentArrayAsync,
} from "./layout.mjs";
import { readInstanceSupportAsync } from "./support.mjs";

const {
  Promise,
  JSON: { stringify: stringifyJSON },
} = globalThis;

export const writeInstanceEslintAsync = async (home, component, instance) => {
  const envs = await readInstanceSupportAsync(home, component, instance);
  await writeFileAsync(
    getInstanceEslintUrl(home, component, instance),
    stringifyJSON(
      {
        env: {
          node: !envs.includes("browser"),
          browser: !envs.includes("node") && !envs.includes("test"),
        },
        rules: {
          "import/no-nodejs-modules": [
            envs.includes("browser") ? "error" : "off",
          ],
        },
        overrides: [
          {
            files: "**/*.test.mjs",
            env: { node: true },
            rules: { "import/no-nodejs-modules": ["off"] },
          },
        ],
      },
      null,
      2,
    ),
    "utf8",
  );
};

export const writeComponentEslintAsync = async (home, component) => {
  await Promise.all(
    (
      await readInstanceArrayAsync(home, component)
    ).map((instance) => writeInstanceEslintAsync(home, component, instance)),
  );
};

export const writeEslintAsync = async (home) => {
  await Promise.all(
    (
      await readComponentArrayAsync(home)
    ).map((component) => writeComponentEslintAsync(home, component)),
  );
};
