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
  const session = createSession(configuration);
  assertDeepEqual(initializeSession(session), {
    type: "initialize",
    data: configuration,
  });
  assertDeepEqual(sendSession(session, "message"), {
    type: "send",
    data: "message",
  });
  assertDeepEqual(
    terminateSession(session, { errors: [new TypeError("BOUM")], status: 0 }),
    {
      type: "terminate",
      data: { errors: [{ name: "TypeError", message: "BOUM" }], status: 0 },
    },
  );
};

testAsync();
