import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import { validateMessage } from "../../validate/index.mjs";
import { stringifyLocation } from "../../location/index.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import { inflate } from "../../compress/index.mjs";
import {
  createFrontend,
  flushContent,
  getFreshTab,
  getSession,
  getSerializationEmptyValue,
  instrument,
  instrumentAsync,
  recordError,
  recordStartTrack,
  recordStopTrack,
  recordGroup,
  recordBeforeJumpEvent,
  recordAfterJumpEvent,
  recordBeginBundleEvent,
  recordEndBundleEvent,
  recordBeginApplyEvent,
  recordEndReturnEvent,
  recordEndThrowEvent,
  recordBeforeAwaitEvent,
  recordBeforeYieldEvent,
  recordAfterResolveEvent,
  recordAfterRejectEvent,
  recordBeforeRequestEvent,
  recordAfterResponseEvent,
  recordBeginRequestEvent,
  recordBeginRequestAmend,
  recordEndResponseEvent,
  recordBeforeQueryEvent,
  recordAfterAnswerEvent,
} from "./index.mjs";

const {
  Error,
  undefined,
  JSON: { parse: parseJSON },
} = globalThis;

const validateBuffer = (frontend) => {
  const content = flushContent(frontend);
  if (content !== null) {
    for (const message of inflate(parseJSON(content))) {
      validateMessage(message);
    }
  }
};

const configuration = extendConfiguration(
  createConfiguration("protocol://host/home"),
  {
    session: "session",
    packages: [
      {
        regexp: "^",
      },
    ],
  },
  "protocol://host/base",
);

const frontend = createFrontend(configuration);

validateBuffer(frontend);

assertEqual(getSession(frontend), "session");

assertEqual(typeof getSerializationEmptyValue(frontend), "symbol");

assertEqual(typeof getFreshTab(frontend), "number");

assertDeepEqual(
  instrument(frontend, "protocol://host/filename.js", "123;", () => {
    throw new Error("deadcode");
  }),
  "123;\n",
);

assertDeepEqual(
  await instrumentAsync(frontend, "protocol://host/filename.js", "123;", () => {
    throw new Error("deadcode");
  }),
  "123;\n",
);

validateBuffer(frontend);

const testRecord = (method, frontend, ...args) => {
  assertEqual(method(frontend, ...args), undefined);
  validateBuffer(frontend);
};

testRecord(recordError, frontend, "error");

testRecord(
  recordStartTrack,
  frontend,
  "track",
  createConfiguration("protocol://host/home/"),
);

testRecord(recordStopTrack, frontend, "track", { type: "manual" });

testRecord(recordGroup, frontend, 123, 456, "description");

const TAB = 123;
const TIME = 456;
const GROUP = 789;

const testRecordEvent = (method, frontend, ...args) => {
  testRecord(method, frontend, TAB, GROUP, TIME, ...args);
};

testRecordEvent(recordBeforeJumpEvent, frontend);

testRecordEvent(recordAfterJumpEvent, frontend);

testRecordEvent(recordBeginBundleEvent, frontend);

testRecordEvent(recordEndBundleEvent, frontend);

const location_string = stringifyLocation({
  url: "protocol://host/path/source.js",
  hash: null,
  position: {
    line: 123,
    column: 456,
  },
});

testRecordEvent(recordBeginApplyEvent, frontend, location_string, "this", [
  "arg0",
  "arg1",
]);
testRecordEvent(recordEndReturnEvent, frontend, location_string, "result");
testRecordEvent(recordEndThrowEvent, frontend, location_string, "error");

testRecordEvent(recordBeforeAwaitEvent, frontend, "promise");
testRecordEvent(recordBeforeYieldEvent, frontend, "iterator");
testRecordEvent(recordAfterResolveEvent, frontend, "result");
testRecordEvent(recordAfterRejectEvent, frontend, "error");

for (const recordRequest of [
  recordBeforeRequestEvent,
  recordBeginRequestEvent,
]) {
  testRecordEvent(
    recordRequest,
    frontend,
    "HTTP/1.1",
    "GET",
    "/",
    null,
    { header: "value" },
    "body",
  );
}

testRecord(
  recordBeginRequestAmend,
  frontend,
  TAB,
  "HTTP/1.1",
  "GET",
  "/",
  null,
  { header: "value" },
  "body",
);

for (const recordResponse of [
  recordAfterResponseEvent,
  recordEndResponseEvent,
]) {
  testRecordEvent(
    recordResponse,
    frontend,
    200,
    "OK",
    { header: "value" },
    "body",
  );
}

testRecordEvent(
  recordBeforeQueryEvent,
  frontend,
  "database",
  "version",
  "sql",
  ["parameter"],
);

testRecordEvent(
  recordBeforeQueryEvent,
  frontend,
  "database",
  "version",
  "sql",
  { name: "parameter" },
);

testRecordEvent(recordAfterAnswerEvent, frontend);

testRecordEvent(
  recordBeforeQueryEvent,
  frontend,
  "database",
  "version",
  "sql",
  [
    {
      toString: () => "parameter",
    },
  ],
);
