import { strict as Assert } from "assert";
import { buildTestAsync } from "../../../build/index.mjs";
import Session from "./session.mjs";
import Message from "./message.mjs";

const { deepEqual: assertDeepEqual } = Assert;

const testAsync = async () => {
  const dependencies = await buildTestAsync({
    ...import.meta,
    deps: ["configuration"],
  });
  const {
    configuration: { createConfiguration },
  } = dependencies;
  const { createSession, initializeSession } = Session(dependencies);
  const { messageEvent } = Message(dependencies);
  const session = createSession(createConfiguration("/"));
  initializeSession(session);
  assertDeepEqual(messageEvent(session, "event"), {
    type: "send",
    data: { type: "event", data: "event" },
  });
};

testAsync();
