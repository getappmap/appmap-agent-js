import { cwd } from "node:process";
import "../../__fixture__.mjs";
import { toDirectoryUrl } from "../../url/index.mjs";
import { convertPathToFileUrl } from "../../path/index.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import { record } from "./index.mjs";

const base = toDirectoryUrl(convertPathToFileUrl(cwd()));

record(
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
    base,
  ),
);
