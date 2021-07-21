import { strict as Assert } from "assert";
import { buildAllAsync } from "../../../build.mjs";
import Session from "./session.mjs";

const { deepEqual } = Assert;

const mainAsync = async () => {
  const {
    initializeSession,
    terminateSession,
    asyncSessionTermination,
    sendSession,
  } = Session(
    await buildAllAsync(["expect", "util", "client"], {
      expect: "error",
      client: "mock",
    }),
  );
  const buffer = [];
  const session = initializeSession("identifier", { buffer });
  sendSession(session, "message");
  terminateSession(session, "reason");
  await asyncSessionTermination(session);
  deepEqual(buffer, [
    {
      type: "initialize",
      session: "identifier",
      options: { buffer },
    },
    {
      type: "send",
      session: "identifier",
      message: "message",
    },
    {
      type: "terminate",
      session: "identifier",
      reason: "reason",
    },
  ]);
};

mainAsync();
