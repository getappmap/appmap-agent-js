import "../../__fixture__.mjs";
import * as Jest from "@jest/globals";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import { record } from "./index.mjs";

const { test: testJest } = Jest;

record(
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
);

testJest("name1", () => {});

testJest("name2", () => {});
