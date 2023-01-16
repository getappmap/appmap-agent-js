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

const configuration = createConfiguration("file:///w:/home/");

record(
  extendConfigurationNode(
    extendConfiguration(
      configuration,
      {
        processes: [{ regexp: "", enabled: true }],
        hooks: { cjs: false, esm: false, apply: false, http: false },
        recorder: "jest",
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
