import { version } from "node:process";
import "../../__fixture__.mjs";
import { convertFileUrlToPath } from "../../path/index.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import { extendConfigurationNode } from "../../configuration-accessor/index.mjs";
import { record } from "./process.mjs";

record(
  extendConfigurationNode(
    extendConfiguration(
      createConfiguration("file:///w:/home/"),
      {
        processes: [{ regexp: "", enabled: true }],
        hooks: { cjs: false, esm: false, apply: false, http: false },
        recorder: "remote",
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
