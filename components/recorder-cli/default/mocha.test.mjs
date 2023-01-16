import { version } from "node:process";
import { mochaHooks as hooks } from "../../../lib/node/mocha-hook.mjs";
import "../../__fixture__.mjs";
import { convertFileUrlToPath } from "../../path/index.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import { extendConfigurationNode } from "../../configuration-accessor/index.mjs";
import { record } from "./mocha.mjs";

record(
  extendConfigurationNode(
    extendConfiguration(
      createConfiguration("file:///w:/home/"),
      {
        recorder: "mocha",
        hooks: { cjs: false, esm: false, apply: false, http: false },
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
