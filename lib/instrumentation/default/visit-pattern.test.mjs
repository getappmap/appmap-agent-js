import { buildTestAsync } from "../../../build/index.mjs";
import { testVisitor } from "./__fixture__.mjs";
import VisitPattern from "./visit-pattern.mjs";

const testAsync = async () => {
  const visitors = VisitPattern(await buildTestAsync(import.meta));

  testVisitor("({foo} = {bar});", ["body", 0, "expression", "left"], visitors);

  testVisitor(
    "({foo: bar = 123} = {qux});",
    ["body", 0, "expression", "left", "properties", 0, "value"],
    visitors,
  );

  testVisitor("([foo] = {bar});", ["body", 0, "expression", "left"], visitors);

  testVisitor(
    "([...foo] = {bar});",
    ["body", 0, "expression", "left", "elements", 0],
    visitors,
  );
};

testAsync();
