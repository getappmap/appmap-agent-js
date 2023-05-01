import "../../__fixture__.mjs";
import * as Jest from "@jest/globals";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import { readGlobal } from "../../global/index.mjs";
import { record } from "./index.mjs";

const { test: testJest } = Jest;

const getLastMockSocket = readGlobal("GET_LAST_MOCK_SOCKET");
const receiveMockSocket = readGlobal("RECEIVE_MOCK_SOCKET");

record(
  extendConfiguration(
    createConfiguration("file:///w:/home/"),
    {
      processes: [{ regexp: "", enabled: true }],
      recorder: "jest",
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

receiveMockSocket(getLastMockSocket(), "0");

testJest("name1", () => {});

testJest("name2", () => {});
