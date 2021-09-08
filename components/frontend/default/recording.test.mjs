import { strict as Assert } from "assert";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Session from "./session.mjs";
import Recording from "./recording.mjs";

const { deepEqual: assertDeepEqual, equal: assertEqual } = Assert;

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { createConfiguration } = await buildTestComponentAsync("configuration");

const {
  createRecording,
  setCurrentGroup,
  getSerializationEmptyValue,
  incrementEventCounter,
  recordBeginApply,
  recordEndApply,
  recordBeforeQuery,
  recordAfterQuery,
} = Recording(dependencies);
const { createSession, initializeSession } = Session(dependencies);
const configuration = createConfiguration("/");
const recording = createRecording(configuration);
const session = createSession(configuration);
setCurrentGroup({ recording }, "group");
initializeSession(session);
assertEqual(typeof incrementEventCounter({ recording }), "number");
assertEqual(typeof getSerializationEmptyValue({ recording }), "symbol");
const createMessage = (type, index, data) => ({
  type: "trace",
  data: {
    type: "event",
    data: {
      type,
      time: 0,
      index,
      group: "group",
      data,
    },
  },
});
assertDeepEqual(
  recordBeginApply({ session, recording }, "index", {
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
  recordEndApply({ session, recording }, "index", {
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
  recordBeforeQuery({ session, recording }, "index", {
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
  recordBeforeQuery({ session, recording }, "index", {
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
  recordAfterQuery({ session, recording }, "index", {
    error: 123,
  }),
  createMessage("after", "index", {
    type: "query",
    error: { type: "number", print: "123" },
  }),
);
