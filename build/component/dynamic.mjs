import { readdir as readdirAsync, lstat as lstatAsync } from "fs/promises";
import {
  sep as path_separator,
  relative as toRelativePath,
  dirname as getDirectory,
  basename as getFilename,
  join as joinPath,
} from "path";
import { fileURLToPath } from "url";
import { expect } from "./expect.mjs";
import { loadConfAsync } from "./conf.mjs";

const { Object, Map } = globalThis;

const __filname = fileURLToPath(import.meta.url);
const __dirname = getDirectory(__filname);
const { entries: toEntries } = Object;

const getInstanceAsync = async (
  component,
  { branch, blueprint, root, conf },
) => {
  if (blueprint.has(component)) {
    const instance = blueprint.get(component);
    const { branches, dependencies } = await loadConfAsync(
      joinPath(root, component, instance, conf),
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
  for (const instance of await readdirAsync(joinPath(root, component))) {
    if ((await lstatAsync(joinPath(root, component, instance))).isDirectory()) {
      const { branches, dependencies } = await loadConfAsync(
        joinPath(root, component, instance, conf),
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
      joinPath(toRelativePath(__dirname, root), component, instance, main)
        .split(path_separator)
        .join("/")
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
  root: joinPath(__dirname, "..", "..", "components"),
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
  let relative_path = toRelativePath(root, path);
  let component = null;
  let instance = null;
  while (relative_path !== ".") {
    instance = component;
    component = getFilename(relative_path);
    relative_path = getDirectory(relative_path);
  }
  const { dependencies } = await loadConfAsync(
    joinPath(root, component, instance, conf),
  );
  return visitComponentsAsync(dependencies, context);
};
