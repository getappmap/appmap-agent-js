import { strict as Assert } from "assert";
import { buildAsync } from "../../../build/index.mjs";
import Session from "./session.mjs";

const { deepEqual: assertDeepEqual } = Assert;

const mainAsync = async () => {
  const { createSession, initializeSession, terminateSession, sendSession } =
    Session(
      await buildAsync({
        util: "default",
        expect: "error",
      }),
    );
  const session = createSession("uuid", "options");
  assertDeepEqual(initializeSession(session), {
    type: "initialize",
    session: "uuid",
    options: "options",
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

mainAsync();
