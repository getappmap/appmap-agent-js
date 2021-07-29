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
  const { hookNativeModuleAsync, transformSourceDefault } =
    Native(dependencies);
  const box = createBox(null);
  assertEqual(
    transformSourceDefault("foo", "bar", () => "qux"),
    "qux",
  );
  assertDeepEqual(
    await testHookAsync(
      hookNativeModuleAsync,
      {
        box,
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
        const transformSource = getBox(box);
        assertEqual(
          _eval(
            transformSource(
              from("123;", "utf8"),
              { format: "module", ...import.meta },
              (code) => code,
            ),
          ),
          123,
        );
      },
    ),
    [
      {
        type: "send",
        session: "uuid",
        data: {
          type: "file",
          data: {
            index: 0,
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
