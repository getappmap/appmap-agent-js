import { strict as Assert } from "assert";
import { writeFile, mkdir, rm } from "fs/promises";
import { tmpdir } from "os";
import { buildAsync, buildAllAsync } from "./build.mjs";

const { random: global_Math_random } = Math;

(async () => {
  const root = `${tmpdir()}/${global_Math_random().toString(36).substring(2)}`;
  try {
    const architecture = {
      foo: {
        fooA: [],
      },
      bar: {
        barA: ["foo"],
      },
      qux: {
        common: ["foo", "bar"],
      },
    };
    await mkdir(root);
    await mkdir(`${root}/foo`);
    await mkdir(`${root}/foo/fooA`);
    await writeFile(
      `${root}/foo/fooA/index.mjs`,
      `
        import {strict as Assert} from "assert";
        export default (dependencies) => {
          Assert.deepEqual(dependencies, {__proto__:null});
          return "FOO";
        };
      `,
      "utf8",
    );
    await mkdir(`${root}/bar`);
    await mkdir(`${root}/bar/barA`);
    await writeFile(
      `${root}/bar/barA/index.mjs`,
      `
        import {strict as Assert} from "assert";
        export default (dependencies) => {
          Assert.deepEqual(dependencies, {__proto__:null, foo:"FOO"});
          return "BAR";
        };
      `,
      "utf8",
    );
    await mkdir(`${root}/qux`);
    await mkdir(`${root}/qux/common`);
    await writeFile(
      `${root}/qux/common/index.mjs`,
      `
        import {strict as Assert} from "assert";
        export default (dependencies) => {
          Assert.deepEqual(dependencies, {__proto__:null, foo:"FOO", bar:"BAR"});
          return "QUX";
        };
      `,
      "utf8",
    );
    Assert.equal(
      await buildAsync(
        "qux",
        {
          foo: "fooA",
          bar: "barA",
        },
        {
          architecture,
          root,
        },
      ),
      "QUX",
    );
    Assert.deepEqual(
      await buildAllAsync(
        ["qux"],
        {
          qux: ["QUX"],
        },
        {
          architecture,
          root,
        },
      ),
      { __proto__: null, qux: ["QUX"] },
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
})().catch((error) => {
  throw error;
});
