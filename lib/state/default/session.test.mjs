import { strict as Assert } from "assert";
import { buildTestAsync } from "../../../build/index.mjs";
import Session from "./session.mjs";

const { deepEqual: assertDeepEqual } = Assert;

const testAsync = async () => {
  const dependencies = await buildTestAsync({
    ...import.meta,
    deps: ["configuration"],
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
