import { cwd } from "node:process";
import { mochaHooks as hooks } from "../../../lib/node/mocha-hook.mjs";
import "../../__fixture__.mjs";
import { toDirectoryUrl } from "../../url/index.mjs";
import { convertPathToFileUrl } from "../../path/index.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import { record } from "./index.mjs";

const home = toDirectoryUrl(convertPathToFileUrl(cwd()));

record(
  extendConfiguration(
    createConfiguration(home),
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

const { beforeAll, beforeEach, afterEach, afterAll } = hooks;

await beforeAll();

await beforeEach.call({
  currentTest: {
    parent: {
      fullTitle: () => "full-title-1",
    },
  },
});

await afterEach.call({
  currentTest: {
    state: "passed",
  },
});

await afterAll();
