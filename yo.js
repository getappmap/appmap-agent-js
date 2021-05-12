#!/usr/bin/env node

console.log(process.pid, process.argv);

// test/hooks.js
// console.log(require("module"));
// console.log(module);
// require("./yoyo.js");
//
// import * as Module from "module";
// import "./yoyo.mjs";
//
// const require = Module.createRequire(import.meta.url);
//
// console.log(require.cache);

// console.log(module);
// console.log(exports);
// console.log(require);

// console.log(Reflect.getOwnPropertyDescriptor(require, "main"));
// console.log(require("module"));

// exports.mochaHooks = {
//   beforeEach(done) {
//     console.log("beforeEach", this);
//     done();
//   },
//   afterEach(done) {
//     console.log("afterEach", this);
//     done();
//   },
//   beforeAll (done) {
//     console.log("beforeAll", this);
//     done();
//   },
//   afterAll (done) {
//     console.log("afterAll", this);
//     done();
//   },
// };
