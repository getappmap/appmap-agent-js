/* c8 ignore start */
import { strict as Assert } from "assert";
import { pathToFileURL } from "url";
import { writeFile, mkdir, rm } from "fs/promises";
import YAML from "yaml";
import { tmpdir } from "os";

const { deepEqual: assertDeepEqual } = Assert;
const { stringify: stringifyYAML } = YAML;
const { random } = Math;

const writeInstanceAsync = async (
  component,
  instance,
  { root, conf, main },
  config,
) => {
  const directory = `${root}/${component}/${instance}`;
  await mkdir(directory);
  await writeFile(`${directory}/${conf}`, stringifyYAML(config), "utf8");
  await writeFile(
    `${directory}/${main}`,
    `export default (dependencies) => ["${component}", "${instance}", {__proto__:null, ...dependencies}];`,
    "utf8",
  );
};

export const testAsync = async (type, module) => {
  const root = `${tmpdir()}/${random().toString(36).substring(2)}`;
  const main = "foo.mjs";
  const conf = "bar.yml";
  const options = { root, main, conf };
  try {
    // Setup //
    await mkdir(root);
    await mkdir(`${root}/component1`);
    await writeInstanceAsync("component1", "instance", options, {
      branches: ["branch1", "branch2"],
      dependencies: ["component2"],
    });
    await mkdir(`${root}/component2`);
    await writeInstanceAsync("component2", "instance1", options, {
      branches: ["branch1", "branch2"],
      dependencies: [],
    });
    await writeInstanceAsync("component2", "instance2", options, {
      branches: ["branch1"],
      dependencies: [],
    });
    // Test //
    const dependencies = {
      __proto__: null,
      component2: ["component2", "instance1", { __proto__: null }],
    };
    if (type === "dynamic") {
      const {
        buildComponentAsync,
        buildComponentsAsync,
        buildDependenciesAsync,
      } = module;
      assertDeepEqual(
        await buildComponentAsync(
          "branch1",
          "component1",
          { component2: "instance1" },
          options,
        ),
        ["component1", "instance", dependencies],
      );
      assertDeepEqual(
        await buildComponentsAsync("branch2", ["component2"], {}, options),
        dependencies,
      );
      assertDeepEqual(
        await buildDependenciesAsync(
          "branch2",
          pathToFileURL(`${root}/component1/instance`),
          {},
          options,
        ),
        dependencies,
      );
    } else if (type === "static") {
      const { writeEntryPointAsync } = module;
      await writeEntryPointAsync("branch1", "component1", {
        directory: root,
        ...options,
      });
      const { default: Component1 } = await import(
        `${root}/branch1-component1.mjs`
      );
      assertDeepEqual(Component1({ component2: "instance1" }), [
        "component1",
        "instance",
        dependencies,
      ]);
    } else {
      throw new Error("Invalid type");
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
};

/* c8 ignore stop */
