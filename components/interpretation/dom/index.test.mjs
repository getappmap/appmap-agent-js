/* eslint-env node */
import { assertEqual } from "../../__fixture__.mjs";
import { buildTestDependenciesAsync } from "../../build.mjs";
import JsDom from "jsdom";

const {
  undefined
} = globalThis;

const { JSDOM } = JsDom;

const { window } = new JSDOM("", {
  runScripts: "dangerously",
});
globalThis.document = window.document;
const { default: Interpretation } = await import("./index.mjs");
const { runScript } = Interpretation(
  await buildTestDependenciesAsync(import.meta.url),
);
assertEqual(runScript("var x = 123;", "file:///script.js"), undefined);
assertEqual(window.x, 123);
