import {
  assertEqual,
  assertDeepEqual,
  makeAbsolutePath,
} from "../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Native from "./native.mjs";

const _eval = eval;

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { testHookAsync } = await buildTestComponentAsync("hook");
const { createConfiguration } = await buildTestComponentAsync("configuration");
const { hookNativeModule, unhookNativeModule } = Native(dependencies);
global.APPMAP_TRANSFORM_MODULE_ASYNC = null;
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
          await global.APPMAP_TRANSFORM_MODULE_ASYNC(import.meta.url, "123;"),
        ),
        123,
      );
    },
  ),
  {
    sources: [
      {
        url: import.meta.url,
        content: "123;",
        shallow: true,
        exclude: createConfiguration(makeAbsolutePath("dummy")).exclude,
        inline: false,
      },
    ],
    events: [],
  },
);
