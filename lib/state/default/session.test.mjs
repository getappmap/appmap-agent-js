import { strict as Assert } from "assert";
import { buildAsync } from "../../../build/index.mjs";
import Session from "./session.mjs";

const { deepEqual: assertDeepEqual } = Assert;

const testAsync = async () => {
  const dependencies = await buildAsync({
    violation: "error",
    assert: "debug",
    util: "default",
    specifier: "default",
    repository: "stub",
    configuration: "default",
  });
  const {
    configuration: { createConfiguration },
  } = dependencies;
  const { createSession, initializeSession, terminateSession, sendSession } =
    Session(dependencies);
  const configuration = createConfiguration("/");
  const session = createSession("uuid", configuration);
  assertDeepEqual(initializeSession(session), {
    type: "initialize",
    session: "uuid",
    configuration,
  });
  assertDeepEqual(sendSession(session, "data"), {
    type: "send",
    session: "uuid",
    data: "data",
  });
  assertDeepEqual(terminateSession(session, "reason"), {
    type: "terminate",
    session: "uuid",
    reason: "reason",
  });
};

testAsync();
