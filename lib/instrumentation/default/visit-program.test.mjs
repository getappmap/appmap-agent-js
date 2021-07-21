import { testVisitor } from "./__fixture__.mjs";
import VisitProgram from "./visit-program.mjs";
import { buildAsync } from "../../../build/index.mjs";

const mainAsync = async () => {
  testVisitor(";", [], VisitProgram(await buildAsync({})));
};

mainAsync();
