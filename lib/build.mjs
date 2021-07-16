import { format } from "util";
import { readFile } from "fs/promises";
import { dirname } from "path";
import { fileURLToPath } from "url";
import YAML from "yaml";

const { getOwnPropertyDescriptor: global_Reflect_getOwnPropertyDescriptor } =
  Reflect;
const global_undefined = undefined;
const global_Error = Error;

const __dirname = dirname(fileURLToPath(import.meta.url));

const architecture_promise = readFile(
  `${__dirname}/architecture.yml`,
  "utf8",
).then(YAML.parse);

const hasOwnProperty = (object, key) =>
  global_Reflect_getOwnPropertyDescriptor(object, key) !== global_undefined;

/* c8 ignore start */
const assert = (boolean, template, ...rest) => {
  if (!boolean) {
    throw new global_Error(format(template, ...rest));
  }
};
/* c8 ignore stop */

const buildComponentAsync = async (type, context) => {
  const { architecture, blueprint, cache, root, main } = context;
  assert(
    hasOwnProperty(architecture, type),
    `invalid component type: %s`,
    type,
  );
  if (type in cache) {
    return cache[type];
  }
  const name = type in blueprint ? blueprint[type] : "common";
  if (typeof name !== "string") {
    return (cache[type] = name);
  }
  assert(
    hasOwnProperty(architecture[type], name),
    `invalid %s component name: %s`,
    type,
    name,
  );
  const dependencies = { __proto__: null };
  for (const dependency of architecture[type][name]) {
    dependencies[dependency] = await buildComponentAsync(dependency, context);
  }
  return (cache[type] = (
    await import(`${root}/${type}/${name}/${main}`)
  ).default(dependencies));
};

const createContextAsync = async (blueprint, options) => ({
  architecture: await architecture_promise,
  root: `${__dirname}/components`,
  main: "index.mjs",
  ...options,
  blueprint: { __proto__: null, ...blueprint },
  cache: { __proto__: null },
});

export const buildAsync = async (type, blueprint, options) =>
  buildComponentAsync(type, await createContextAsync(blueprint, options));

export const buildAllAsync = async (types, blueprint, options) => {
  const context = await createContextAsync(blueprint, options);
  const components = { __proto__: null };
  for (const type of types) {
    components[type] = await buildComponentAsync(type, context);
  }
  return components;
};
