/* global x */
import { strict as Assert } from "assert";
import { buildTestAsync } from "../../../build/index.mjs";
import component from "./index.mjs";

const testAsync = async () => {
  const { runScript } = component(await buildTestAsync(import.meta));
  Assert.equal(runScript("let x = 123;"), undefined);
  Assert.equal(x, 123);
};

testAsync();
