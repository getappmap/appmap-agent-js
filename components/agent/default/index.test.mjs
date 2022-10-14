import { assertDeepEqual, assertEqual } from "../../__fixture__.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs?env=test";
import {
  openAgent,
  closeAgent,
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
} from "./index.mjs?env=test";

const { eval: evalGlobal } = globalThis;

const agent = openAgent(
  extendConfiguration(
    createConfiguration("file:///w:/home/"),
    {
      packages: ["*"],
    },
    "file:///w:/base/",
  ),
);

getSerializationEmptyValue(agent);

recordStartTrack(agent, "record", {}, null);
recordGroup(agent, 123, "description");
assertEqual(
  evalGlobal(
    instrument(agent, { url: "file:///w:/base/main.js", content: "123;" }),
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
    type: "group",
    group: 0,
    child: 123,
    description: "description",
  },
  {
    type: "source",
    url: "file:///w:/base/main.js",
    content: "123;",
    exclude: createConfiguration("file:///w:/home").exclude,
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
