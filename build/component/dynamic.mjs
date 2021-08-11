import { readdir, lstat } from "fs/promises";
import { relative, dirname } from "path";
import { fileURLToPath } from "url";
import { expect } from "./expect.mjs";
import { loadConfAsync } from "./conf.mjs";

const __filname = fileURLToPath(import.meta.url);
const __dirname = dirname(__filname);
const { entries: toEntries } = Object;

const getInstanceAsync = async (
  component,
  { branch, blueprint, root, conf },
) => {
  if (blueprint.has(component)) {
    const instance = blueprint.get(component);
    const { branches, dependencies } = await loadConfAsync(
      `${root}/${component}/${instance}/${conf}`,
    );
    expect(
      branches.includes(branch),
      "instance %s of component %s is not available for branch %s",
      instance,
      component,
      branch,
    );
    return {
      instance,
      dependencies,
    };
  }
  const results = [];
  for (const instance of await readdir(`${root}/${component}`)) {
    if ((await lstat(`${root}/${component}/${instance}`)).isDirectory()) {
      const { branches, dependencies } = await loadConfAsync(
        `${root}/${component}/${instance}/${conf}`,
      );
      if (branches.includes(branch)) {
        results.push({ instance, dependencies });
      }
    }
  }
  const { length } = results;
  expect(
    length > 0,
    "component %s has no instance available for branch %s",
    component,
    branch,
  );
  expect(
    length <= 1,
    "component %s has multiple instances available for branch %s",
    component,
    branch,
  );
  const [result] = results;
  return result;
};

const visitComponentAsync = async (component, context) => {
  const { cache, root, main } = context;
  if (!cache.has(component)) {
    const { instance, dependencies } = await getInstanceAsync(
      component,
      context,
    );
    const { default: Component } = await import(
      `${root}/${component}/${instance}/${main}`
    );
    cache.set(
      component,
      Component(await visitComponentsAsync(dependencies, context)),
    );
  }
  return cache.get(component);
};

const visitComponentsAsync = async (components, context) => {
  const map = { __proto__: null };
  for (const component of components) {
    map[component] = await visitComponentAsync(component, context);
  }
  return map;
};

const createContext = (branch, blueprint, options) => ({
  conf: ".build.yml",
  main: "index.mjs",
  root: `${__dirname}/../../components`,
  ...options,
  branch,
  blueprint: new Map(toEntries(blueprint)),
  cache: new Map(),
});

export const buildComponentAsync = (
  branch,
  component,
  blueprint = {},
  options = {},
) => visitComponentAsync(component, createContext(branch, blueprint, options));

export const buildComponentsAsync = (
  branch,
  components,
  blueprint = {},
  options = {},
) =>
  visitComponentsAsync(components, createContext(branch, blueprint, options));

export const buildDependenciesAsync = async (
  branch,
  url,
  blueprint = {},
  options = {},
) => {
  const path = fileURLToPath(url);
  const context = createContext(branch, blueprint, options);
  const { root, conf } = context;
  const [component, instance] = relative(root, path).split("/");
  const { dependencies } = await loadConfAsync(
    `${root}/${component}/${instance}/${conf}`,
  );
  return visitComponentsAsync(dependencies, context);
};
