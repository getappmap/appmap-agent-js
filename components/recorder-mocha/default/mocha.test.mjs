// import { strict as Assert } from "assert";
// import { EventEmitter } from "events";
// import { makeMochaHooks } from "../../../../../../lib/client/node/recorder/mocha-main.js";
//
// const emitter = new EventEmitter();
// const trace = [];
//
// emitter.env = {
//   APPMAP_PROTOCOL: {
//     request: (json) => {
//       trace.push(json);
//       if (json.action === "initialize") {
//         return {
//           session: `__HIDDEN__`,
//           hooks: {},
//         };
//       }
//       return null;
//     },
//     requestAsync: () => {
//       Assert.fail();
//     },
//   },
// };
//
// emitter.argv = ["node", "main.js", "arg0"];
//
// emitter.versions = {
//   node: "123.456",
// };
//
// emitter.cwd = () => "/cwd";
//
// const { beforeEach, afterEach } = makeMochaHooks(emitter);
//
// const hook = {
//   currentTest: {
//     parent: {
//       fullTitle(...args) {
//         Assert.equal(this, hook.currentTest.parent);
//         Assert.deepEqual(args, []);
//         return "foo";
//       },
//     },
//     fullTitle(...args) {
//       Assert.equal(this, hook.currentTest);
//       Assert.deepEqual(args, []);
//       return "foo bar";
//     },
//   },
// };
// beforeEach.call(hook);
// afterEach.call(hook);
//
// emitter.emit("exit", "code", "signal");
//
// Assert.deepEqual(trace, [
//   {
//     action: "initialize",
//     session: null,
//     data: {
//       __proto__: null,
//       cwd: "/cwd",
//       engine: {
//         name: "node",
//         version: "123.456",
//       },
//       main: {
//         path: "main.js",
//       },
//     },
//   },
//   {
//     action: "start",
//     session: `__HIDDEN__`,
//     data: {
//       cwd: "/cwd",
//       "class-map-pruning": true,
//       "event-pruning": false,
//       base: ".",
//       "map-name": "foo bar",
//       output: {
//         "file-name": "foo-0",
//       },
//       recorder: "mocha",
//     },
//   },
//   {
//     action: "stop",
//     session: `__HIDDEN__`,
//     data: null,
//   },
//   {
//     action: "terminate",
//     session: `__HIDDEN__`,
//     data: { type: "exit", code: "code", signal: "signal" },
//   },
// ]);
