import { testVisitor } from "./__fixture__.mjs";
import VisitProgram from "./visit-program.mjs";

testVisitor(";", [], VisitProgram({}));
