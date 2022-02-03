/* eslint-env node */
import { assertDeepEqual, assertEqual } from "../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Agent from "./index.mjs";

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration", "test");
const {
  openAgent,
  closeAgent,
  instrument,
  takeLocalAgentTrace,
  startTrack,
  stopTrack,
  getInstrumentationIdentifier,
  getSerializationEmptyValue,
  recordBeforeQuery,
  recordAfterQuery,
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
assertEqual(typeof getInstrumentationIdentifier(agent), "string");
startTrack(agent, "record", { path: null, data: {} });
assertEqual(
  eval(instrument(agent, { url: "file:///base/main.js", content: "123;" })),
  123,
);
recordAfterQuery(
  agent,
  recordBeforeQuery(agent, {
    database: "mysql",
    version: null,
    sql: "SELECT 123;",
    parameters: [],
  }),
  { error: getSerializationEmptyValue(agent) },
);
stopTrack(agent, "record", { errors: [], status: 0 });
closeAgent(agent, { errors: [], status: 123 });
const { sources, events } = takeLocalAgentTrace(agent, "record");
assertDeepEqual(
  { sources, events },
  {
    sources: [
      {
        url: "file:///base/main.js",
        content: "123;",
        exclude: createConfiguration("file:///home").exclude,
        shallow: false,
        inline: false,
      },
    ],
    events: [
      {
        type: "before",
        index: 1,
        time: 0,
        data: {
          type: "query",
          database: "mysql",
          version: null,
          sql: "SELECT 123;",
          parameters: [],
        },
      },
      {
        type: "after",
        index: 1,
        time: 0,
        data: { type: "query", error: null },
      },
    ],
  },
);
