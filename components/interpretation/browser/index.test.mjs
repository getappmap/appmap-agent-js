/* eslint-env node */
import { buildTestAsync } from "../../build.mjs";

import { strict as Assert } from "assert";
import { JSDOM } from "jsdom";

const testAsync = async () => {
  const { window } = new JSDOM("", {
    runScripts: "dangerously",
  });
  global.document = window.document;
  const { default: Interpretation } = await import("./index.mjs");
  const { runScript } = Interpretation(await buildTestAsync(import.meta));
  Assert.equal(runScript("var x = 123;"), undefined);
  Assert.equal(window.x, 123);
};

testAsync();
