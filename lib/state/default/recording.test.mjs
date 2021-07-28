import { strict as Assert } from "assert";
import { buildAsync } from "../../../build/index.mjs";
import Session from "./session.mjs";
import Recording from "./recording.mjs";

const { deepEqual: assertDeepEqual, equal: assertEqual } = Assert;

const mainAsync = async () => {
  const dependencies = await buildAsync({
    violation: "error",
    assert: "debug",
    util: "default",
    time: "stub",
    serialization: "stub",
  });
  const {
    createRecording,
    setCurrentGroup,
    getSerializationEmptyValue,
    incrementEventCounter,
    recordBeforeApply,
    recordAfterApply,
  } = Recording(dependencies);
  const { createSession, initializeSession } = Session(dependencies);
  const recording = createRecording("options");
  const session = createSession("uuid", "options");
  setCurrentGroup({ recording }, "group");
  initializeSession(session);
  assertEqual(typeof incrementEventCounter({ recording }), "number");
  assertEqual(typeof getSerializationEmptyValue({ recording }), "symbol");
  assertDeepEqual(
    recordBeforeApply({ session, recording }, "index", {
      function: "function",
      this: 123,
      arguments: [456],
    }),
    {
      type: "send",
      session: "uuid",
      data: {
        type: "event",
        data: {
          type: "before",
          time: 0,
          index: "index",
          group: "group",
          data: {
            type: "apply",
            function: "function",
            this: "123",
            arguments: ["456"],
          },
        },
      },
    },
  );
  assertDeepEqual(
    recordAfterApply({ session, recording }, "index", {
      result: 123,
      error: 456,
    }),
    {
      type: "send",
      session: "uuid",
      data: {
        type: "event",
        data: {
          type: "after",
          time: 0,
          index: "index",
          group: "group",
          data: {
            type: "apply",
            result: "123",
            error: "456",
          },
        },
      },
    },
  );
};

mainAsync();
