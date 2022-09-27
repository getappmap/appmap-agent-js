import { hasOwn, doesNotInclude } from "./util.mjs";

const { undefined, Error } = globalThis;

const start = ["node", "browser"];

const exclusion = {
  node: ["browser"],
  test: ["browser"],
  browser: ["node"],
};

const getEnvExclusion = (env) => {
  if (hasOwn(exclusion, env)) {
    return exclusion[env];
  } else {
    throw new Error(`Missing eslint environment: ${env}`);
  }
};

export const toEslintEnvs = (envs) =>
  start.filter(doesNotInclude.bind(undefined, envs.flatMap(getEnvExclusion)));
