import { strict as Assert } from "assert";
import { fileURLToPath } from "url";
import { buildTestAsync } from "../../../src/build.mjs";
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
  const dependencies = await buildTestAsync({
    ...import.meta,
    deps: ["hook"],
  });
  const {
    hook: { testHookAsync },
  } = dependencies;
  const { hookNativeModule, unhookNativeModule } = Native(dependencies);
  global.APPMAP_TRANSFORM_SOURCE = null;
  assertDeepEqual(
    await testHookAsync(
      hookNativeModule,
      unhookNativeModule,
      {
        conf: {
          hooks: { esm: true },
          packages: [
            {
              regexp: "^",
            },
          ],
        },
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
        type: "send",
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
