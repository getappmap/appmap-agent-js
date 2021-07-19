import { strict as Assert } from "assert";
import { JSDOM } from "jsdom";

const mainAsync = async () => {
  const { window } = new JSDOM("", {
    runScripts: "dangerously",
  });
  global.document = window.document;
  const { default: Interpretation } = await import("./index.mjs");
  const { runScript } = Interpretation({});
  Assert.equal(runScript("var x = 123;"), undefined);
  Assert.equal(window.x, 123);
};

mainAsync();
