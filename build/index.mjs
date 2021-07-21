import { readFile } from "fs/promises";
import YAML from "yaml";
import { home } from "./home.mjs";
import { assert } from "./assert.mjs";

const _Map = Map;
const { ownKeys } = Reflect;
const { entries, fromEntries } = Object;
const { parse: parseYAML } = YAML;

const buildComponentAsync = async (type, context) => {
  const { blueprint, cache, root, main, deps } = context;
  assert(blueprint.has(type), "missing component name for %s", type);
  const name = blueprint.get(type);
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
        parseYAML(
          await readFile(`${root}/${type}/${name}/${deps}`, "utf8"),
        ).map(async (type) => [type, await buildComponentAsync(type, context)]),
      ),
    ),
  );
  cache.set(type, component);
  return component;
};

const createContextAsync = async (blueprint, options) => {
  const { root } = { root: `${home}/lib`, ...options };
  return {
    deps: ".deps.yml",
    main: "index.mjs",
    ...options,
    root,
    blueprint: new _Map(entries(blueprint)),
    cache: new _Map(),
  };
};

export const buildAllAsync = async (types, blueprint, options) => {
  const context = await createContextAsync(blueprint, options);
  return fromEntries(
    await Promise.all(
      types.map(async (type) => [
        type,
        await buildComponentAsync(type, context),
      ]),
    ),
  );
};

export const buildOneAsync = async (type, blueprint, options) =>
  buildComponentAsync(type, await createContextAsync(blueprint, options));

export const buildAsync = async (blueprint, options) =>
  buildAllAsync(ownKeys(blueprint), blueprint, options);
