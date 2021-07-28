import { strict as Assert } from "assert";
import { buildAsync } from "../../../build/index.mjs";
import Session from "./session.mjs";
import Message from "./message.mjs";

const { deepEqual: assertDeepEqual } = Assert;

const testAsync = async () => {
  const dependencies = await buildAsync({
    violation: "error",
    assert: "debug",
    util: "default",
  });
  const { createSession, initializeSession } = Session(dependencies);
  const { messageEvent } = Message(dependencies);
  const session = createSession("uuid", "options");
  initializeSession(session);
  assertDeepEqual(messageEvent(session, "event"), {
    type: "send",
    session: "uuid",
    data: { type: "event", data: "event" },
  });
};

testAsync();
