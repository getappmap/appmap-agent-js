/* eslint-env node */
import { assertEqual } from "../../__fixture__.mjs";
/* eslint-disable import/no-unresolved */
import JsDom from "jsdom";
/* eslint-enable import/no-unresolved */

const { undefined } = globalThis;

const { JSDOM } = JsDom;

const { window } = new JSDOM("", {
  runScripts: "dangerously",
});

globalThis.document = window.document;

const { runScript } = await import("./index.mjs?env=test");

assertEqual(runScript("var x = 123;", "protocol://host/script.js"), undefined);

assertEqual(window.x, 123);
