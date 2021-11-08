import { dirname, relative } from "path";
import { readdir, writeFile, lstat } from "fs/promises";
import { fileURLToPath } from "url";
import { expect } from "./expect.mjs";
import { loadConfAsync } from "./conf.mjs";

const { entries: toEntries } = Object;
const __filname = fileURLToPath(import.meta.url);
const __dirname = dirname(__filname);

const indent = (line) => `  ${line}`;

const getIdentifier = (component, instance) =>
  `${component.replace(/-/gu, "_")}$${instance.replace(/-/gu, "_")}`;

const visitComponentAsync = async (component, context) => {
  const { branch, cache, root, main, conf, directory, blueprint } = context;
  /* c8 ignore start */
  if (cache.has(component)) {
    return { head: [], body: [] };
  }
  /* c8 ignore stop */
  cache.add(component);
  const head = [];
  const body = [];
  const instances = [];
  const components = [];
  if (blueprint.has(component)) {
    for (const instance of blueprint.get(component)) {
      const { branches, dependencies } = await loadConfAsync(
        `${root}/${component}/${instance}/${conf}`,
      );
      expect(
        branches.includes(branch),
        "component %s of instance %s is not available for branch %s",
        component,
        instance,
        branch,
      );
      instances.push(instance);
      components.push(...dependencies);
    }
  } else {
    for (const instance of await readdir(`${root}/${component}`)) {
      if ((await lstat(`${root}/${component}/${instance}`)).isDirectory()) {
        const { branches, dependencies } = await loadConfAsync(
          `${root}/${component}/${instance}/${conf}`,
        );
        if (branches.includes(branch)) {
          instances.push(instance);
          components.push(...dependencies);
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
  for (const component of components) {
    const { head: lines1, body: lines2 } = await visitComponentAsync(
      component,
      context,
    );
    head.push(...lines1);
    body.push(...lines2);
  }
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
      ...(length === 1
        ? [
            `dependencies["${component}"] = ${getIdentifier(
              component,
              instances[0],
            )}(dependencies);`,
          ]
        : [
            `if (!("${component}" in blueprint)) { throw new Error("missing instance for component ${component}"); }`,
            `dependencies["${component}"] = ${instances.reduce(
              (code, instance) =>
                `(blueprint["${component}"] === "${instance}" ? ${getIdentifier(
                  component,
                  instance,
                )}(dependencies) : ${code})`,
              `((() => { throw new Error("invalid instance for component ${component}"); }) ())`,
            )};`,
          ]),
    ],
  };
};

export const writeEntryPointAsync = async (branch, component, options) => {
  const context = {
    root: `${__dirname}/../../components`,
    directory: `${__dirname}/../../dist/${branch}`,
    filename: `${component}.mjs`,
    conf: ".build.yml",
    main: "index.mjs",
    blueprint: {},
    ...options,
    branch,
    cache: new Set(),
  };
  context.blueprint = new Map(toEntries(context.blueprint));
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
