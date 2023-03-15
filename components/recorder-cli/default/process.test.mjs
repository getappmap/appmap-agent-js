import { version } from "node:process";
import "../../__fixture__.mjs";
import { convertFileUrlToPath } from "../../path/index.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import { record } from "./process.mjs";

record(
  {
    pid: 123,
    cwd: () => convertFileUrlToPath("file:///w:/cwd"),
    argv: ["node", "main.mjs"],
    version,
  },
  extendConfiguration(
    createConfiguration("file:///w:/home/"),
    {
      processes: [{ regexp: "", enabled: true }],
      recorder: "remote",
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
