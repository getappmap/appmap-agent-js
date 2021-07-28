import { testVisitor } from "./__fixture__.mjs";
import VisitProgram from "./visit-program.mjs";
import { buildAsync } from "../../../build/index.mjs";

const testAsync = async () => {
  testVisitor(
    ";",
    [],
    VisitProgram(
      await buildAsync({
        violation: "error",
        assert: "debug",
        util: "default",
      }),
    ),
  );
};

testAsync();
