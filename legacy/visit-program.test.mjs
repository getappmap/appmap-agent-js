import { testVisitor } from "./__fixture__.mjs";
import VisitProgram from "./visit-program.mjs";
import { buildTestAsync } from "../../../build/index.mjs";

const testAsync = async () => {
  testVisitor(";", [], VisitProgram(await buildTestAsync(import.meta)));
};

testAsync();
