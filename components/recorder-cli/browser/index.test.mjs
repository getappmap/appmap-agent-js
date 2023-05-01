import { exit } from "node:process";
import "../../__fixture__.mjs";
import { defineGlobal } from "../../global/index.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";

const { Promise, setTimeout } = globalThis;

defineGlobal("window", {
  addEventListener: () => {},
});

const { recordAsync } = await import("./index.mjs");

await recordAsync(
  extendConfiguration(
    createConfiguration("file:///w:/home/"),
    {
      heartbeat: 100,
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

await new Promise((resolve) => {
  setTimeout(resolve, 300);
});

exit(0);
