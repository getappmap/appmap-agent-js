import { strict as Assert } from "assert";
import { fileURLToPath } from "url";
import { buildTestAsync } from "../../../build/index.mjs";
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
    deps: ["hook", "util"],
  });
  const {
    util: { createBox, getBox },
    hook: { testHookAsync },
  } = dependencies;
  const { hookNativeModule, unhookNativeModule, transformSourceDefault } =
    Native(dependencies);
  assertEqual(
    transformSourceDefault("foo", "bar", () => "qux"),
    "qux",
  );
  const testCaseAsync = async (enabled) => {
    const box = createBox(null);
    assertDeepEqual(
      await testHookAsync(
        hookNativeModule,
        unhookNativeModule,
        {
          box,
          conf: {
            hooks: { esm: enabled },
            packages: [
              {
                regexp: "^",
              },
            ],
          },
        },
        async () => {
          const transformSource = getBox(box);
          assertEqual(
            _eval(
              transformSource(
                from("123;", "utf8"),
                { format: "module", ...import.meta },
                (code) => code,
              ).toString("utf8"),
            ),
            123,
          );
        },
      ),
      enabled
        ? [
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
          ]
        : [],
    );
  };

  await testCaseAsync(true);
  await testCaseAsync(false);
};

testAsync();
