import { assertDeepEqual, assertEqual } from "../../__fixture__.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import {
  openAgent,
  closeAgent,
  getSession,
  instrument,
  takeLocalAgentTrace,
  recordStartTrack,
  recordStopTrack,
  getSerializationEmptyValue,
  getFreshTab,
  recordGroup,
  recordBeforeEvent,
  recordAfterEvent,
  formatQueryPayload,
  getAnswerPayload,
} from "./index.mjs";

const { eval: evalGlobal } = globalThis;

const configuration = extendConfiguration(
  createConfiguration("protocol://host/home/"),
  {
    "postmortem-function-exclusion": false,
    packages: [{ regexp: "^", relative: false }],
  },
  "protocol://host/base/",
);

const agent = openAgent(configuration);

assertEqual(getSession(agent), "uuid");

getSerializationEmptyValue(agent);

recordStartTrack(agent, "record", configuration);
recordGroup(agent, 123, "description");
assertEqual(
  evalGlobal(
    instrument(
      agent,
      {
        url: "protocol://host/base/main.js",
        content: "123;",
      },
      {
        url: "protocol://host/base/sourcemap.json",
        content: {
          version: 3,
          file: "main.js",
          sources: ["data:,456%3B"],
          names: [],
          mappings: "A,AAAB;;ABCDE;",
        },
      },
    ),
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
recordStopTrack(agent, "record", { type: "manual" });
assertDeepEqual(takeLocalAgentTrace(agent, "record"), {
  configuration,
  messages: [
    {
      type: "source",
      url: "data:,456%3B",
      content: "456;",
    },
    {
      type: "group",
      session: "uuid",
      group: 0,
      child: 123,
      description: "description",
    },
    {
      type: "event",
      session: "uuid",
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
      session: "uuid",
      site: "after",
      tab: 1,
      group: 0,
      time: 0,
      payload: { type: "answer" },
    },
  ],
  termination: { type: "manual" },
});
closeAgent(agent);
