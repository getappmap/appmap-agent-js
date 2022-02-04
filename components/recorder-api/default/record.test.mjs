import { assertDeepEqual } from "../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Record from "./record.mjs";

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const {
  recordBundle,
  recordApply,
  recordResponse,
  recordJump,
  recordQuery,
  recordRequest,
} = Record(dependencies);
const { openAgent, closeAgent, startTrack, stopTrack, takeLocalAgentTrace } =
  await buildTestComponentAsync("agent");
const { createConfiguration } = await buildTestComponentAsync("configuration");

const configuration = createConfiguration("file:///home");

const makeEvent = (type, data) => ({
  type,
  index: 1,
  time: 0,
  data,
});

const test = (
  record,
  data1,
  data2,
  type1,
  type2,
  sanitized_data1,
  sanitized_data2,
) => {
  const agent = openAgent(configuration);
  startTrack(agent, "track", { path: null, data: {} });
  record(agent, data1)(data2);
  stopTrack(agent, "track", { errors: [], status: 0 });
  assertDeepEqual(takeLocalAgentTrace(agent, "track").events, [
    makeEvent(type1, sanitized_data1),
    makeEvent(type2, sanitized_data2),
  ]);
  closeAgent(agent);
};

test(
  recordBundle,
  null,
  null,
  "begin",
  "end",
  { type: "bundle" },
  { type: "bundle" },
);

test(
  recordApply,
  null,
  { result: null },
  "begin",
  "end",
  {
    type: "apply",
    function: null,
    this: { type: "undefined", print: "undefined" },
    arguments: [],
  },
  {
    type: "apply",
    error: null,
    result: { type: "null", print: "null" },
  },
);

test(
  recordResponse,
  null,
  null,
  "begin",
  "end",
  {
    type: "response",
    protocol: "HTTP/1.1",
    method: "GET",
    url: "/",
    headers: {},
    route: null,
  },
  { type: "response", status: 200, message: "OK", headers: {} },
);

test(
  recordJump,
  null,
  null,
  "before",
  "after",
  {
    type: "jump",
  },
  { type: "jump" },
);

test(
  recordQuery,
  null,
  null,
  "before",
  "after",
  {
    type: "query",
    database: "unknown",
    version: "unknown",
    sql: "unknown",
    parameters: [],
  },
  { type: "query", error: null },
);

test(
  recordRequest,
  null,
  null,
  "before",
  "after",
  {
    type: "request",
    protocol: "HTTP/1.1",
    method: "GET",
    url: "/",
    headers: {},
    route: null,
  },
  { type: "request", status: 200, message: "OK", headers: {} },
);

test(
  recordRequest,
  { headers: { key: "value" }, route: "route" },
  null,
  "before",
  "after",
  {
    type: "request",
    protocol: "HTTP/1.1",
    method: "GET",
    url: "/",
    headers: { key: "value" },
    route: "route",
  },
  { type: "request", status: 200, message: "OK", headers: {} },
);
