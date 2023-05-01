import { cwd } from "node:process";
import "../../__fixture__.mjs";
import { toDirectoryUrl } from "../../url/index.mjs";
import { convertPathToFileUrl } from "../../path/index.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import { recordAsync } from "./index.mjs";

const base = toDirectoryUrl(convertPathToFileUrl(cwd()));

for (const recorder of ["process", "remote"]) {
  await recordAsync(
    extendConfiguration(
      createConfiguration("file:///w:/home/"),
      {
        processes: [{ regexp: "", enabled: true }],
        recorder,
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
}
