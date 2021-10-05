import { strict as Assert } from "assert";
import { fileURLToPath } from "url";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
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
  const dependencies = await buildTestDependenciesAsync(import.meta.url);
  const { testHookAsync } = await buildTestComponentAsync("hook");
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
            shallow: true,
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
    {
      files: [
        {
          index: 0,
          exclude: [],
          type: "module",
          path: fileURLToPath(import.meta.url),
          code: "123;",
          shallow: true,
          source: false,
        },
      ],
      events: [],
    },
  );
};

testAsync();
