import { cwd } from "node:process";
import { mochaHooks as hooks } from "../../../lib/node/mocha-hook.mjs";
import "../../__fixture__.mjs";
import { toDirectoryUrl } from "../../url/index.mjs";
import { readGlobal } from "../../global/index.mjs";
import { convertPathToFileUrl } from "../../path/index.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import { recordAsync } from "./index.mjs";

const { Error, setImmediate, undefined } = globalThis;

const getLastMockSocket = readGlobal("GET_LAST_MOCK_SOCKET");
const receiveMockSocket = readGlobal("RECEIVE_MOCK_SOCKET");

const home = toDirectoryUrl(convertPathToFileUrl(cwd()));

await recordAsync(
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

setImmediate(() => {
  receiveMockSocket(getLastMockSocket(), "0");
});

const startTest = () =>
  beforeEach.call({
    currentTest: {
      parent: {
        fullTitle: () => "full-title-1",
      },
    },
  });

await startTest();

await afterEach.call({
  currentTest: {
    state: "passed",
  },
});

await startTest();

await afterEach.call({
  currentTest: {
    state: "failed",
    err: new Error("test error"),
  },
});

await afterAll();

const testFailure = async (error) => {
  await startTest();
  return afterEach.call({
    currentTest: {
      state: "failed",
      err: error,
    },
  });
};

await testFailure(undefined);
await testFailure({ name: "TestError", message: "test error" });
await testFailure({
  name: "TestError",
  message: "test error",
  stack: "TestError: test error\n  at /app/foo-bar.js:4:6",
});
