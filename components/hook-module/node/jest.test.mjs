import { default as Transformer } from "../../../lib/node/transformer-jest.mjs";
import { assertDeepEqual } from "../../__fixture__.mjs";
import { convertFileUrlToPath } from "../../path/index.mjs";
import { createConfiguration } from "../../configuration/index.mjs";
import { testHookAsync } from "../../hook-fixture/index.mjs";
import * as HookJest from "./jest.mjs";

const { createTransformer } = Transformer;

assertDeepEqual(
  await testHookAsync(
    HookJest,
    {
      configuration: {
        hooks: { cjs: true, esm: false },
        packages: [
          {
            regexp: "^",
            shallow: true,
          },
        ],
      },
      url: "file:///A:/base/",
    },
    async () => {
      const { process, processAsync } = await createTransformer({});
      process(
        "module.exports = 123;",
        convertFileUrlToPath("file:///A:/cjs.cjs"),
        { supportsStaticESM: false },
      );
      await processAsync(
        "export default 123;",
        convertFileUrlToPath("file:///A:/esm.mjs"),
        { supportsStaticESM: true },
      );
    },
  ),
  [
    {
      type: "source",
      url: "file:///A:/cjs.cjs",
      content: "module.exports = 123;",
      exclude: createConfiguration("protocol://host/home").exclude,
      shallow: true,
      inline: false,
    },
  ],
);
