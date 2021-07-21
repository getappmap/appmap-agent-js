import { strict as Assert } from "assert";
import { writeFile, mkdir, rm } from "fs/promises";
import { tmpdir } from "os";
import { buildAsync, buildOneAsync } from "./index.mjs";

const { random } = Math;
const { equal: assertEqual, deepEqual: assertDeepEqual } = Assert;

const mainAsync = async () => {
  const root = `${tmpdir()}/${random().toString(36).substring(2)}`;
  try {
    await mkdir(root);
    await mkdir(`${root}/foo`);
    await mkdir(`${root}/foo/fooA`);
    await writeFile(`${root}/foo/fooA/.deps.yml`, "[]", "utf8");
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
    await writeFile(`${root}/bar/barA/.deps.yml`, "[foo]", "utf8");
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
    await writeFile(`${root}/qux/default/.deps.yml`, "[foo, bar]", "utf8");
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
    assertEqual(
      await buildOneAsync(
        "qux",
        {
          qux: "default",
          foo: "fooA",
          bar: "barA",
        },
        { root },
      ),
      "QUX",
    );
    assertDeepEqual(await buildAsync({ qux: ["QUX"] }, { root }), {
      qux: ["QUX"],
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
};

mainAsync();
