import { strict as Assert } from "assert";
import { buildDependenciesAsync, buildOneAsync } from "../../build.mjs";
import Session from "./session.mjs";

const { deepEqual: assertDeepEqual } = Assert;

const testAsync = async () => {
  const dependencies = await buildDependenciesAsync(import.meta.url, "test");
  const { createConfiguration } = await buildOneAsync("configuration", "test");
  const { createSession, initializeSession, terminateSession, sendSession } =
    Session(dependencies);
  const configuration = createConfiguration("/");
  const session = createSession(configuration);
  assertDeepEqual(initializeSession(session), {
    type: "initialize",
    data: configuration,
  });
  assertDeepEqual(sendSession(session, "message"), {
    type: "trace",
    data: "message",
  });
  {
    const message = terminateSession(session, {
      errors: [new TypeError("BOUM")],
      status: 0,
    });
    delete message.data.errors[0].stack;
    assertDeepEqual(message, {
      type: "terminate",
      data: { errors: [{ name: "TypeError", message: "BOUM" }], status: 0 },
    });
  }
  assertDeepEqual(sendSession(session, "message"), null);
};

testAsync();
