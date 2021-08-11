import { dirname, relative } from "path";
import { readdir, writeFile, lstat } from "fs/promises";
import { fileURLToPath } from "url";
import { expect } from "./expect.mjs";
import { loadConfAsync } from "./conf.mjs";

const __filname = fileURLToPath(import.meta.url);
const __dirname = dirname(__filname);

const indent = (line) => `  ${line}`;

const getIdentifier = (component, instance) =>
  `${component.replace(/-/gu, "_")}$${instance.replace(/-/gu, "_")}`;

const visitComponentAsync = async (component, context) => {
  const { branch, cache, root, main, conf, directory } = context;
  /* c8 ignore start */
  if (cache.has(component)) {
    return { head: [], body: [] };
  }
  /* c8 ignore stop */
  cache.add(component);
  const head = [];
  const body = [];
  const instances = [];
  for (const instance of await readdir(`${root}/${component}`)) {
    if ((await lstat(`${root}/${component}/${instance}`)).isDirectory()) {
      const { branches, dependencies } = await loadConfAsync(
        `${root}/${component}/${instance}/${conf}`,
      );
      if (branches.includes(branch)) {
        instances.push(instance);
        for (const component of dependencies) {
          const { head: lines1, body: lines2 } = await visitComponentAsync(
            component,
            context,
          );
          head.push(...lines1);
          body.push(...lines2);
        }
      }
    }
  }
  const { length } = instances;
  expect(
    length > 0,
    "component %s has no instance for branch %s",
    component,
    branch,
  );
  return {
    head: [
      ...head,
      ...instances.map(
        (instance) =>
          `import ${getIdentifier(component, instance)} from "./${relative(
            directory,
            `${root}/${component}/${instance}/${main}`,
          )}";`,
      ),
    ],
    body: [
      ...body,
      length === 1
        ? `dependencies["${component}"] = ${getIdentifier(
            component,
            instances[0],
          )}(dependencies);`
        : `dependencies["${component}"] = ${instances.reduce(
            (code, instance) =>
              `(blueprint["${component}"] === "${instance}" ? ${getIdentifier(
                component,
                instance,
              )}(dependencies) : ${code})`,
            `((() => { throw new Error("invalid instance for component ${component}"); }) ())`,
          )};`,
    ],
  };
};

export const writeEntryPointAsync = async (branch, component, options) => {
  const context = {
    root: `${__dirname}/../../components`,
    directory: `${__dirname}/../../dist`,
    filename: `${branch}-${component}.mjs`,
    conf: ".build.yml",
    main: "index.mjs",
    ...options,
    branch,
    cache: new Set(),
  };
  const { directory, filename } = context;
  const { head, body } = await visitComponentAsync(component, context);
  await writeFile(
    `${directory}/${filename}`,
    [
      ...head,
      "",
      "export default (blueprint) => {",
      "  const dependencies = {__proto__:null};",
      ...body.map(indent),
      `  return dependencies["${component}"];`,
      "};",
    ].join("\n"),
    "utf8",
  );
};
