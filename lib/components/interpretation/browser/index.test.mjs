import { strict as Assert } from "assert";
import { JSDOM } from "jsdom";

const { window } = new JSDOM("", {
  runScripts: "dangerously",
});

global.document = window.document;

import("./index.mjs").then(({ default: component }) => {
  const { runScript } = component({}, {});
  Assert.equal(runScript("var x = 123;"), undefined);
  Assert.equal(window.x, 123);
});
