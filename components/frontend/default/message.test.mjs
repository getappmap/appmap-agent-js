import { strict as Assert } from "assert";
import { buildDependenciesAsync, buildOneAsync } from "../../build.mjs";
import Session from "./session.mjs";
import Message from "./message.mjs";

const { deepEqual: assertDeepEqual } = Assert;

const testAsync = async () => {
  const dependencies = await buildDependenciesAsync(import.meta.url, "test");
  const { createConfiguration } = await buildOneAsync("configuration", "test");
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
