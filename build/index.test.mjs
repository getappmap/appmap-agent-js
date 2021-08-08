import { strict as Assert } from "assert";
import { writeFile, mkdir, rm } from "fs/promises";
import { pathToFileURL } from "url";
import { tmpdir } from "os";
import {
  buildDependenciesAsync,
  buildOneAsync,
  buildAllAsync,
} from "./index.mjs";

const { random } = Math;
const { deepEqual: assertDeepEqual } = Assert;

const mainAsync = async () => {
  const root = `${tmpdir()}/${random().toString(36).substring(2)}`;
  try {
    await mkdir(root);
    await mkdir(`${root}/foo`);
    await mkdir(`${root}/foo/fooA`);
    await writeFile(
      `${root}/foo/.build.yml`,
      ["default:", "  prod: null", "  test: fooA", "dependencies: []"].join(
        "\n",
      ),
      "utf8",
    );
    await writeFile(
      `${root}/foo/fooA/index.mjs`,
      `
        import {strict as Assert} from "assert";
        const {deepEqual:assertDeepEqual} = Assert;
        export default (dependencies) => {
          assertDeepEqual(dependencies, {});
          return "FOO";
        };
      `,
      "utf8",
    );
    await mkdir(`${root}/bar`);
    await mkdir(`${root}/bar/barA`);
    await writeFile(
      `${root}/bar/.build.yml`,
      [
        "default:",
        "  prod: null",
        "  test: barA",
        "dependencies:",
        "  barA: [foo]",
      ].join("\n"),
      "utf8",
    );
    await writeFile(
      `${root}/bar/barA/index.mjs`,
      `
        import {strict as Assert} from "assert";
        const {deepEqual:assertDeepEqual} = Assert;
        export default (dependencies) => {
          assertDeepEqual(dependencies, {foo:"FOO"});
          return "BAR";
        };
      `,
      "utf8",
    );
    await mkdir(`${root}/qux`);
    await mkdir(`${root}/qux/default`);
    await writeFile(
      `${root}/qux/.build.yml`,
      [
        "default:",
        "  prod: null",
        "  test: default",
        "dependencies: [foo, bar]",
      ].join("\n"),
      "utf8",
    );
    await writeFile(
      `${root}/qux/default/index.mjs`,
      `
        import {strict as Assert} from "assert";
        const {deepEqual:assertDeepEqual} = Assert;
        export default (dependencies) => {
          assertDeepEqual(dependencies, {foo:"FOO", bar:"BAR"});
          return "QUX";
        };
      `,
      "utf8",
    );
    assertDeepEqual(
      await buildAllAsync(
        ["qux"],
        "test",
        {
          qux: "default",
          foo: "fooA",
          bar: "barA",
        },
        { root },
      ),
      { qux: "QUX" },
    );
    assertDeepEqual(
      await buildOneAsync(
        "qux",
        "test",
        {
          qux: 123,
        },
        { root },
      ),
      123,
    );
    assertDeepEqual(
      await buildDependenciesAsync(
        pathToFileURL(`${root}/qux/default/index.mjs`),
        "test",
        {},
        { root },
      ),
      {
        foo: "FOO",
        bar: "BAR",
      },
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
};

mainAsync();
