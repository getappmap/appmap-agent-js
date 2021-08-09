import { strict as Assert } from "assert";
import { fileURLToPath } from "url";
import { buildDependenciesAsync, buildOneAsync } from "../../build.mjs";
import Native from "./native.mjs";

const { from } = Buffer;
const _eval = eval;
const {
  // ok: assert,
  equal: assertEqual,
  // notEqual: assertNotEqual,
  deepEqual: assertDeepEqual,
} = Assert;

const testAsync = async () => {
  const dependencies = await buildDependenciesAsync(import.meta.url, "test");
  const { testHookAsync } = await buildOneAsync("hook", "test");
  const { hookNativeModule, unhookNativeModule } = Native(dependencies);
  global.APPMAP_TRANSFORM_SOURCE = null;
  assertDeepEqual(
    await testHookAsync(
      hookNativeModule,
      unhookNativeModule,
      {
        hooks: { esm: true },
        packages: [
          {
            regexp: "^",
          },
        ],
      },
      async () => {
        assertEqual(
          _eval(
            global
              .APPMAP_TRANSFORM_SOURCE(
                from("123;", "utf8"),
                { format: "module", ...import.meta },
                (code) => code,
              )
              .toString("utf8"),
          ),
          123,
        );
      },
    ),
    [
      {
        type: "trace",
        data: {
          type: "file",
          data: {
            index: 0,
            exclude: [],
            type: "module",
            path: fileURLToPath(import.meta.url),
            code: "123;",
          },
        },
      },
    ],
  );
};

testAsync();
