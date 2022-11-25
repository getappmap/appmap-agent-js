import {
  writeFile as writeFileAsync,
  unlink as unlinkAsync,
} from "node:fs/promises";
import { hasOwn } from "./util.mjs";
import {
  getInstanceEslintUrl,
  readInstanceArrayAsync,
  readComponentArrayAsync,
} from "./layout.mjs";
import { readInstanceSupportAsync } from "./support.mjs";

const {
  Promise,
  Map,
  undefined,
  Error,
  Object: { fromEntries },
  JSON: { stringify: stringifyJSON },
} = globalThis;

export const doesNotInclude = (array, element) => !array.includes(element);

const start = ["node", "browser"];

const exclusion = new Map([
  ["node", ["browser"]],
  ["test", ["browser"]],
  ["browser", ["node"]],
]);

export const toTrueEntry = (key) => [key, true];

const getEnvExclusion = (env) => {
  if (exclusion.has(env)) {
    return exclusion.get(env);
  } else {
    throw new Error(`Missing eslint environment: ${env}`);
  }
};

const toEslintEnvs = (envs) =>
  start.filter(doesNotInclude.bind(undefined, envs.flatMap(getEnvExclusion)));

export const writeInstanceEslintAsync = async (home, component, instance) => {
  const eslint_envs = toEslintEnvs(
    await readInstanceSupportAsync(home, component, instance),
  );
  if (eslint_envs.length === 0) {
    try {
      await unlinkAsync(getInstanceEslintUrl(home, component, instance));
    } catch (error) {
      if (!hasOwn(error, "code") || error.code !== "ENOENT") {
        throw error;
      }
    }
  } else {
    await writeFileAsync(
      getInstanceEslintUrl(home, component, instance),
      stringifyJSON(
        {
          env: fromEntries(eslint_envs.map(toTrueEntry)),
        },
        null,
        2,
      ),
      "utf8",
    );
  }
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
