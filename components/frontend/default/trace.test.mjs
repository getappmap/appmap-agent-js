import { strict as Assert } from "assert";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Session from "./session.mjs";
import Trace from "./trace.mjs";

const { deepEqual: assertDeepEqual } = Assert;

const testAsync = async () => {
  const dependencies = await buildTestDependenciesAsync(import.meta.url);
  const { createConfiguration } = await buildTestComponentAsync(
    "configuration",
  );
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
