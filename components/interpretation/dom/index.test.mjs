import { assertDeepEqual } from "../../__fixture__.mjs";

globalThis.document = {
  createElement: (tag) => ({
    tag,
    type: null,
    text: null,
  }),
  body: {
    appendChild: (element) => {
      assertDeepEqual(element, {
        tag: "script",
        type: "text/javascript",
        text: "123;",
      });
    },
  },
};

const { runScript } = await import("./index.mjs");

runScript("123;", "protocol://host/path");

// We disable test based on JsDom because it is a large dependency.
//
// import { assertEqual } from "../../__fixture__.mjs";
// import JsDom from "jsdom";
//
// const { undefined } = globalThis;
//
// const { JSDOM } = JsDom;
//
// const { window } = new JSDOM("", {
//   runScripts: "dangerously",
// });
//
// globalThis.document = window.document;
//
// const { runScript } = await import("./index.mjs");
//
// assertEqual(runScript("var x = 123;", "protocol://host/script.js"), undefined);
//
// assertEqual(window.x, 123);
