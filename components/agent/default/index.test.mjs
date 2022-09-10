/* eslint-env node */
import { assertDeepEqual, assertEqual } from "../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Agent from "./index.mjs";

const { eval: evalGlobal } = globalThis;

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration", "test");
const {
  openAgent,
  closeAgent,
  instrument,
  takeLocalAgentTrace,
  recordStartTrack,
  recordStopTrack,
  getInstrumentationIdentifier,
  getSerializationEmptyValue,
  getFreshTab,
  recordBeforeEvent,
  recordAfterEvent,
  formatQueryPayload,
  getAnswerPayload,
} = Agent(dependencies);
const agent = openAgent(
  extendConfiguration(
    createConfiguration("file:///home"),
    {
      packages: ["*"],
    },
    "file:///base",
  ),
);

getSerializationEmptyValue(agent);

assertEqual(typeof getInstrumentationIdentifier(agent), "string");
recordStartTrack(agent, "record", {}, null);
assertEqual(
  evalGlobal(
    instrument(agent, { url: "file:///base/main.js", content: "123;" }),
  ),
  123,
);
const tab = getFreshTab(agent);
recordBeforeEvent(
  agent,
  tab,
  formatQueryPayload(agent, "mysql", null, "SELECT 123;", []),
);
recordAfterEvent(agent, tab, getAnswerPayload(agent));
recordStopTrack(agent, "record", 0);
closeAgent(agent);
assertDeepEqual(takeLocalAgentTrace(agent, "record"), [
  {
    type: "start",
    track: "record",
    configuration: {},
    url: null,
  },
  {
    type: "source",
    url: "file:///base/main.js",
    content: "123;",
    exclude: createConfiguration("file:///home").exclude,
    shallow: false,
    inline: false,
  },
  {
    type: "event",
    site: "before",
    tab: 1,
    group: 0,
    time: 0,
    payload: {
      type: "query",
      database: "mysql",
      version: null,
      sql: "SELECT 123;",
      parameters: [],
    },
  },
  {
    type: "event",
    site: "after",
    tab: 1,
    group: 0,
    time: 0,
    payload: { type: "answer" },
  },
  {
    type: "stop",
    track: "record",
    status: 0,
  },
]);
