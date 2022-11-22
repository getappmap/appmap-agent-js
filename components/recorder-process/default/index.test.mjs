import "../../__fixture__.mjs";
import { convertFileUrlToPath } from "../../path/index.mjs?env=test";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs?env=test";
import { main } from "./index.mjs?env=test";

const {
  process: { version },
} = globalThis;

const configuration = createConfiguration("file:///w:/home/");

for (const enabled of [true, false]) {
  main(
    {
      cwd: () => convertFileUrlToPath("file:///w:/cwd"),
      argv: ["node", "main.mjs"],
      version,
    },
    extendConfiguration(
      configuration,
      {
        processes: [{ regexp: "", enabled }],
        recorder: "process",
        hooks: { cjs: false, esm: false, apply: false, http: false },
      },
      "file:///w:/base/",
    ),
  );
}
