import { strict as Assert } from "assert";
import { buildAsync } from "../../../build/index.mjs";
import Session from "./session.mjs";

const { deepEqual: assertDeepEqual } = Assert;

const mainAsync = async () => {
  const {
    initializeSession,
    terminateSession,
    asyncSessionTermination,
    sendSession,
  } = Session(
    await buildAsync({
      util: "default",
      expect: "error",
      client: "mock",
    }),
  );
  const buffer = [];
  const session = initializeSession("identifier", { buffer });
  assertDeepEqual(buffer.pop(), {
    type: "initialize",
    session: "identifier",
    options: { buffer },
  });
  sendSession(session, "message");
  assertDeepEqual(buffer.pop(), {
    type: "send",
    session: "identifier",
    message: "message",
  });
  terminateSession(session, "reason");
  assertDeepEqual(buffer.pop(), {
    type: "terminate",
    session: "identifier",
    reason: "reason",
  });
  await asyncSessionTermination(session);
};

mainAsync();
