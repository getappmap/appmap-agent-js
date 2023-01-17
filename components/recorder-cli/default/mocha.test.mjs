import { version, cwd } from "node:process";
import { mochaHooks as hooks } from "../../../lib/node/mocha-hook.mjs";
import "../../__fixture__.mjs";
import { convertPathToFileUrl, toDirectoryPath } from "../../path/index.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import { extendConfigurationNode } from "../../configuration-accessor/index.mjs";
import { record } from "./mocha.mjs";

record(
  extendConfigurationNode(
    extendConfiguration(
      createConfiguration(convertPathToFileUrl(toDirectoryPath(cwd()))),
      {
        recorder: "mocha",
        hooks: { cjs: false, esm: false, apply: false, http: false },
      },
      "file:///w:/base/",
    ),
    {
      cwd,
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
