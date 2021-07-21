import { strict as Assert } from "assert";
import { buildAsync } from "../../../build/index.mjs";
import Frontend from "./index.mjs";

const { equal: assertEqual, deepEqual: assertDeepEqual } = Assert;

const mainAsync = async () => {
  const {
    initializeFrontend,
    terminateFrontend,
    asyncFrontendTermination,
    instrument,
    getInstrumentationIdentifier,
    getSerializationEmptyValue,
    initializeTrack,
    terminateTrack,
    recordBeforeApply,
    recordAfterApply,
    recordBeforeQuery,
    recordAfterQuery,
    recordBeforeRequest,
    recordAfterRequest,
    recordBeforeResponse,
    recordAfterResponse,
  } = Frontend(
    await buildAsync({
      util: "default",
      expect: "error",
      uuid: "mock",
      instrumentation: "mock",
      client: "mock",
      time: "mock",
      grouping: "none",
    }),
  );
  const buffer = [];
  const frontend = initializeFrontend({ buffer });
  assertEqual(typeof getSerializationEmptyValue(frontend), "symbol");
  assertEqual(typeof getInstrumentationIdentifier(frontend), "string");
  assertDeepEqual(buffer.pop(), {
    type: "initialize",
    session: "uuid",
    options: { buffer },
  });
  const checkMessage = (message) => {
    assertDeepEqual(buffer.pop(), {
      type: "send",
      session: "uuid",
      message: message,
    });
  };
  const track = initializeTrack(frontend, "options");
  checkMessage({
    type: "track",
    data: { type: "initialize", track: 1, options: "options" },
  });
  terminateTrack(frontend, track);
  checkMessage({ type: "track", data: { type: "terminate", track: 1 } });
  assertEqual(instrument(frontend, "kind", "path", "code"), "code");
  checkMessage({
    type: "entity",
    data: { kind: "kind", path: "path", code: "code", children: [] },
  });
  const checkEventMessage = (type, index, data) => {
    checkMessage({
      type: "event",
      data: {
        type,
        index,
        group: 0,
        data,
        time: "now",
      },
    });
  };
  {
    const index = recordBeforeApply(frontend, "function", "this", ["arg"]);
    checkEventMessage("before", 1, {
      type: "apply",
      function: "function",
      this: { type: "string", truncated: false, value: "this" },
      arguments: [{ type: "string", truncated: false, value: "arg" }],
    });
    recordAfterApply(frontend, index, "error", "result");
    checkEventMessage("after", 1, {
      type: "apply",
      error: { type: "string", truncated: false, value: "error" },
      result: { type: "string", truncated: false, value: "result" },
    });
  }
  {
    const index = recordBeforeQuery(frontend, "database", "sql", "parameters");
    checkEventMessage("before", 2, {
      type: "query",
      database: "database",
      sql: "sql",
      parameters: "parameters",
    });
    recordAfterQuery(frontend, index);
    checkEventMessage("after", 2, { type: "query" });
  }
  {
    const index = recordBeforeRequest(frontend, "method", "url", "headers");
    checkEventMessage("before", 3, {
      type: "request",
      method: "method",
      url: "url",
      headers: "headers",
    });
    recordAfterRequest(frontend, index, "status", "message", "headers");
    checkEventMessage("after", 3, {
      type: "request",
      status: "status",
      message: "message",
      headers: "headers",
    });
  }
  {
    const index = recordBeforeResponse(
      frontend,
      "status",
      "message",
      "headers",
    );
    checkEventMessage("before", 4, {
      type: "response",
      status: "status",
      message: "message",
      headers: "headers",
    });
    recordAfterResponse(frontend, index, "method", "url", "headers");
    checkEventMessage("after", 4, {
      type: "response",
      method: "method",
      url: "url",
      headers: "headers",
    });
  }
  terminateFrontend(frontend);
  await asyncFrontendTermination(frontend);
};

mainAsync();
