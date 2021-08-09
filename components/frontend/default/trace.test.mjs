import { strict as Assert } from "assert";
import { buildDependenciesAsync, buildOneAsync } from "../../build.mjs";
import Session from "./session.mjs";
import Trace from "./trace.mjs";

const { deepEqual: assertDeepEqual } = Assert;

const testAsync = async () => {
  const dependencies = await buildDependenciesAsync(import.meta.url, "test");
  const { createConfiguration } = await buildOneAsync("configuration", "test");
  const { createSession, initializeSession } = Session(dependencies);
  const { traceEvent } = Trace(dependencies);
  const session = createSession(createConfiguration("/"));
  initializeSession(session);
  assertDeepEqual(traceEvent(session, "event"), {
    type: "trace",
    data: { type: "event", data: "event" },
  });
};

testAsync();
