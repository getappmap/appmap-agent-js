import { version } from "node:process";
import "../../__fixture__.mjs";
import * as Jest from "@jest/globals";
import { convertFileUrlToPath } from "../../path/index.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import { extendConfigurationNode } from "../../configuration-accessor/index.mjs";
import { record } from "./jest.mjs";

const { test: testJest } = Jest;

record(
  { pid: 123, argv: [] },
  extendConfigurationNode(
    extendConfiguration(
      createConfiguration("file:///w:/home/"),
      {
        processes: [{ regexp: "", enabled: true }],
        recorder: "jest",
        hooks: {
          cjs: false,
          esm: false,
          eval: false,
          apply: false,
          http: false,
          mysql: false,
          pg: false,
          sqlite3: false,
        },
      },
      "file:///w:/base/",
    ),
    {
      cwd: () => convertFileUrlToPath("file:///w:/cwd"),
      argv: ["node", "main.mjs"],
      version,
    },
  ),
);

testJest("name1", () => {});

testJest("name2", () => {});
