import { version, cwd } from "node:process";
import { mochaHooks as hooks } from "../../../lib/node/mocha-hook.mjs";
import "../../__fixture__.mjs";
import { convertPathToFileUrl, toDirectoryPath } from "../../path/index.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import { record } from "./mocha.mjs";

record(
  {
    pid: 123,
    cwd,
    argv: ["node", "main.mjs"],
    version,
  },
  extendConfiguration(
    createConfiguration(convertPathToFileUrl(toDirectoryPath(cwd()))),
    {
      recorder: "mocha",
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

const { beforeEach, afterEach } = hooks;

beforeEach.call({
  currentTest: {
    parent: {
      fullTitle: () => "full-title-1",
    },
  },
});

afterEach.call({
  currentTest: {
    state: "passed",
  },
});
