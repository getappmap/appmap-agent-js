import { strict as Assert } from "assert";
import Instrumentation from "./index.mjs";

const { equal: assertEqual, deepEqual: assertDeepEqual } = Assert;

const mainAsync = async () => {
  const { createInstrumentation, instrument, getInstrumentationIdentifier } =
    Instrumentation({});
  const instrumentation = createInstrumentation({});
  assertEqual(getInstrumentationIdentifier(instrumentation), "$");
  assertDeepEqual(instrument(instrumentation, "kind", "path", "code"), {
    module: { kind: "kind", path: "path", code: "code", children: [] },
    code: "code",
  });
};

mainAsync();
