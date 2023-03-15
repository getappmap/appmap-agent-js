import "../../__fixture__.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import { record } from "./index.mjs";

record(
  extendConfiguration(
    createConfiguration("file:///w:/home/"),
    {
      recorder: "process",
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
