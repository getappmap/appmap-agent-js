import { strict as Assert } from "assert";
import { buildAsync } from "../../../build/index.mjs";
import Frontend from "./index.mjs";

const { equal: assertEqual, deepEqual: assertDeepEqual } = Assert;

const mainAsync = async () => {
  const {
    createFrontend,
    initializeFrontend,
    terminateFrontend,
    createTrack,
    declareGroup,
    getInstrumentationIdentifier,
    instrument,
  } = Frontend(
    await buildAsync({
      util: "default",
      expect: "error",
      uuid: "mock",
      instrumentation: "mock",
      time: "mock",
    }),
  );
  const frontend = createFrontend("options");
  assertDeepEqual(initializeFrontend(frontend), {
    type: "initialize",
    session: "uuid",
    options: "options",
  });
  assertDeepEqual(createTrack(frontend, "options"), {
    index: 1,
    state: { value: 0 },
    options: "options",
  });
  assertDeepEqual(declareGroup(frontend, "group"), {
    type: "send",
    session: "uuid",
    data: { type: "group", data: "group" },
  });
  assertEqual(typeof getInstrumentationIdentifier(frontend), "string");
  assertDeepEqual(instrument(frontend, "kind", "path", "code"), {
    message: {
      type: "send",
      session: "uuid",
      data: {
        type: "module",
        data: { kind: "kind", path: "path", code: "code", children: [] },
      },
    },
    code: "code",
  });
  assertDeepEqual(terminateFrontend(frontend, "reason"), {
    type: "terminate",
    session: "uuid",
    reason: "reason",
  });
};

mainAsync();
