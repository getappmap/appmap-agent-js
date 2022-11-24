import { assertDeepEqual } from "../../__fixture__.mjs";
import { testHookAsync } from "../../hook-fixture/index.mjs";
import * as Hook from "./index.mjs";

assertDeepEqual(
  await testHookAsync(
    Hook,
    {
      configuration: {
        ordering: "chronological",
        hooks: {
          apply: false,
          mysql: false,
          pg: false,
          sqlite3: false,
          cjs: false,
          esm: false,
          http: false,
        },
      },
    },
    async () => {},
  ),
  [],
);
