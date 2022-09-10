/* c8 ignore start */
import { strict as Assert } from "assert";
import { pathToFileURL, fileURLToPath } from "url";
import {
  sep as path_separator,
  dirname as getDirectory,
  join as joinPath,
  relative as toRelativePath,
} from "path";
import {
  writeFile as writeFileAsync,
  mkdir as mkdirAsync,
  rm as rmAsync,
} from "fs/promises";
import YAML from "yaml";
import { tmpdir } from "os";

const { Math, Error } = globalThis;

const __filename = fileURLToPath(import.meta.url);
const __dirname = getDirectory(__filename);

const { deepEqual: assertDeepEqual } = Assert;
const { stringify: stringifyYAML } = YAML;
const { random } = Math;

const writeInstanceAsync = async (
  component,
  instance,
  { root, conf, main },
  config,
) => {
  const directory = joinPath(root, component, instance);
  await mkdirAsync(directory);
  await writeFileAsync(
    joinPath(directory, conf),
    stringifyYAML(config),
    "utf8",
  );
  await writeFileAsync(
    joinPath(directory, main),
    `export default (dependencies) => ["${component}", "${instance}", {__proto__:null, ...dependencies}];`,
    "utf8",
  );
};

export const testAsync = async (type, module) => {
  const root = joinPath(tmpdir(), random().toString(36).substring(2));
  const main = "foo.mjs";
  const conf = "bar.yml";
  const options = { root, main, conf };
  try {
    // Setup //
    await mkdirAsync(root);
    await mkdirAsync(joinPath(root, "component1"));
    await writeInstanceAsync("component1", "instance", options, {
      branches: ["branch1", "branch2"],
      dependencies: ["component2"],
    });
    await mkdirAsync(joinPath(root, "component2"));
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
          pathToFileURL(joinPath(root, "component1", "instance")),
          {},
          options,
        ),
        dependencies,
      );
    } else if (type === "static") {
      const { writeEntryPointAsync } = module;
      {
        await writeEntryPointAsync("branch1", "component1", {
          directory: root,
          filename: "main1.mjs",
          ...options,
        });
        const { default: Component1 } = await import(
          joinPath(toRelativePath(__dirname, root), "main1.mjs")
            .split(path_separator)
            .join("/")
        );
        assertDeepEqual(Component1({ component2: "instance1" }), [
          "component1",
          "instance",
          dependencies,
        ]);
      }
      {
        await writeEntryPointAsync("branch1", "component1", {
          directory: root,
          blueprint: { component2: ["instance1"] },
          filename: "main2.mjs",
          ...options,
        });
        const { default: Component1 } = await import(
          joinPath(toRelativePath(__dirname, root), "main2.mjs")
            .split(path_separator)
            .join("/")
        );
        assertDeepEqual(Component1({}), [
          "component1",
          "instance",
          dependencies,
        ]);
      }
    } else {
      throw new Error("Invalid type");
    }
  } finally {
    await rmAsync(root, { recursive: true });
  }
};

/* c8 ignore stop */
