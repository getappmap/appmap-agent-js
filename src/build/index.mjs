import { readFile } from "fs/promises";
import { relative, dirname } from "path";
import { fileURLToPath } from "url";
import YAML from "yaml";
import { assert } from "./assert.mjs";

const __filname = fileURLToPath(import.meta.url);
const __dirname = dirname(__filname);
const _Map = Map;
const { isArray } = Array;
const _undefined = undefined;
const { getOwnPropertyDescriptor } = Reflect;
const { entries, fromEntries } = Object;
const { parse: parseYAML } = YAML;

const extractName = (type, tag, blueprint, _default) => {
  if (blueprint.has(type)) {
    return blueprint.get(type);
  }
  assert(
    getOwnPropertyDescriptor(_default, tag) !== _undefined,
    "component %s is missing a default name for tag %s",
    type,
    tag,
  );
  const name = _default[tag];
  assert(
    name !== null,
    "component %s is explicitely missing a default name for tag %s",
    type,
    tag,
  );
  return name;
};

const extractTypes = (type, name, dependencies) => {
  if (isArray(dependencies)) {
    return dependencies;
  }
  assert(
    getOwnPropertyDescriptor(dependencies, name) !== _undefined,
    "component %s has not dependencies for %s",
    type,
    name,
  );
  return dependencies[name];
};

const buildComponentAsync = async (type, context) => {
  const { blueprint, tag, cache, root, main, conf } = context;
  if (cache.has(type)) {
    return cache.get(type);
  }
  const { default: _default, dependencies } = parseYAML(
    await readFile(`${root}/${type}/${conf}`, "utf8"),
  );
  const name = extractName(type, tag, blueprint, _default);
  if (typeof name !== "string") {
    cache.set(type, name);
    return name;
  }
  const { default: Component } = await import(
    `${root}/${type}/${name}/${main}`
  );
  const component = Component(
    fromEntries(
      await Promise.all(
        extractTypes(type, name, dependencies).map(async (type) => [
          type,
          await buildComponentAsync(type, context),
        ]),
      ),
    ),
  );
  cache.set(type, component);
  return component;
};

const createContext = (blueprint, options) => ({
  conf: ".build.yml",
  main: "index.mjs",
  root: `${__dirname}/../../lib`,
  tag: "prod",
  ...options,
  blueprint: new _Map(blueprint ? entries(blueprint) : []),
  cache: new _Map(),
});

// export const buildOneAsync = async (type, blueprint, options) =>
//   await buildComponentAsync(type, createContext(blueprint, options));

const buildAsync = async (types, context) =>
  fromEntries(
    await Promise.all(
      types.map(async (type) => [
        type,
        await buildComponentAsync(type, context),
      ]),
    ),
  );

export const buildProdAsync = async (types, blueprint, options) =>
  buildAsync(types, createContext(blueprint, { ...options, tag: "prod" }));

export const buildTestAsync = async (input, blueprint, options) => {
  const { url, deps } = {
    deps: [],
    ...input,
  };
  const path = fileURLToPath(url);
  const context = createContext(blueprint, { tag: "test", ...options });
  const { root, conf } = context;
  const [type, name] = relative(root, path).split("/");
  const { dependencies } = parseYAML(
    await readFile(`${root}/${type}/${conf}`, "utf8"),
  );
  return buildAsync(
    [...deps, ...extractTypes(type, name, dependencies)],
    context,
  );
};
