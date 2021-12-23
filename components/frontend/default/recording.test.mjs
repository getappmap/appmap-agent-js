import { assertDeepEqual, assertEqual } from "../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Recording from "./recording.mjs";

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { createConfiguration } = await buildTestComponentAsync("configuration");

const {
  createRecording,
  getSerializationEmptyValue,
  incrementEventCounter,
  recordBeginApply,
  recordEndApply,
  recordBeforeQuery,
  recordAfterQuery,
} = Recording(dependencies);
const configuration = createConfiguration("/");
const recording = createRecording(configuration);
assertEqual(typeof incrementEventCounter({ recording }), "number");
assertEqual(typeof getSerializationEmptyValue({ recording }), "symbol");
const createMessage = (type1, index, { type: type2, ...data }) => [
  "event",
  type1,
  index,
  0,
  type2,
  data,
];
assertDeepEqual(
  recordBeginApply({ recording }, "index", {
    function: "function",
    this: 123,
    arguments: [456],
  }),
  createMessage("begin", "index", {
    type: "apply",
    function: "function",
    this: { type: "number", print: "123" },
    arguments: [{ type: "number", print: "456" }],
  }),
);
assertDeepEqual(
  recordEndApply({ recording }, "index", {
    result: 123,
    error: 456,
  }),
  createMessage("end", "index", {
    type: "apply",
    result: { type: "number", print: "123" },
    error: { type: "number", print: "456" },
  }),
);
assertDeepEqual(
  recordBeforeQuery({ recording }, "index", {
    database: "database",
    version: "version",
    sql: "sql",
    parameters: [123],
  }),
  createMessage("before", "index", {
    type: "query",
    database: "database",
    version: "version",
    sql: "sql",
    parameters: [{ type: "number", print: "123" }],
  }),
);
assertDeepEqual(
  recordBeforeQuery({ recording }, "index", {
    database: "database",
    version: "version",
    sql: "sql",
    parameters: { name: "parameter" },
  }),
  createMessage("before", "index", {
    type: "query",
    database: "database",
    version: "version",
    sql: "sql",
    parameters: { name: { type: "string", print: "parameter" } },
  }),
);
assertDeepEqual(
  recordAfterQuery({ recording }, "index", {
    error: 123,
  }),
  createMessage("after", "index", {
    type: "query",
    error: { type: "number", print: "123" },
  }),
);
