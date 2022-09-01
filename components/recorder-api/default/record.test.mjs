// import { assertDeepEqual } from "../../__fixture__.mjs";
// import {
//   buildTestDependenciesAsync,
//   buildTestComponentAsync,
// } from "../../build.mjs";
// import Record from "./record.mjs";
//
// const dependencies = await buildTestDependenciesAsync(import.meta.url);
// const {
//   recordBeginBundle,
//   recordApply,
//   recordServerRequest,
//   recordBeforeJump,
//   recordQuery,
//   recordClientRequest,
// } = Record(dependencies);
// const {
//   openAgent,
//   closeAgent,
//   recordStartTrack,
//   recordStopTrack,
//   takeLocalAgentTrace,
// } = await buildTestComponentAsync("agent");
// const { createConfiguration } = await buildTestComponentAsync("configuration");
//
// const configuration = createConfiguration("file:///home");
//
// const test = (record, data1, data2, site1, site2, payload1, payload2) => {
//   const agent = openAgent(configuration);
//   recordStartTrack(agent, "track", {}, null);
//   record(agent, data1)(data2);
//   recordStopTrack(agent, "track", 0);
//   assertDeepEqual(takeLocalAgentTrace(agent, "track"), [
//     {
//       type: "start",
//       track: "track",
//       configuration: {},
//       url: null,
//     },
//     {
//       type: "event",
//       site: site1,
//       strict: false,
//       group: 0,
//       tab: 1,
//       time: 0,
//       payload: payload1,
//     },
//     {
//       type: "event",
//       site: site2,
//       strict: false,
//       group: 0,
//       tab: 1,
//       time: 0,
//       payload: payload2,
//     },
//     {
//       type: "stop",
//       track: "track",
//       status: 0,
//     },
//   ]);
//   closeAgent(agent);
// };
//
// test(
//   recordBeginBundle,
//   null,
//   null,
//   "begin",
//   "end",
//   { type: "bundle" },
//   { type: "bundle" },
// );
//
// test(
//   recordApply,
//   null,
//   { result: null },
//   "begin",
//   "end",
//   {
//     type: "apply",
//     function: null,
//     this: { type: "undefined", print: "undefined" },
//     arguments: [],
//   },
//   {
//     type: "apply",
//     error: null,
//     result: { type: "null", print: "null" },
//   },
// );
//
// test(
//   recordServerRequest,
//   null,
//   null,
//   "begin",
//   "end",
//   {
//     type: "server",
//     protocol: "HTTP/1.1",
//     method: "GET",
//     url: "/",
//     headers: {},
//     route: null,
//     body: null,
//   },
//   { type: "server", status: 200, message: "OK", headers: {}, body: null },
// );
//
// test(
//   recordBeforeJump,
//   null,
//   null,
//   "before",
//   "after",
//   {
//     type: "jump",
//   },
//   { type: "jump" },
// );
//
// test(
//   recordQuery,
//   null,
//   null,
//   "before",
//   "after",
//   {
//     type: "query",
//     database: "unknown",
//     version: "unknown",
//     sql: "unknown",
//     parameters: [],
//   },
//   { type: "query", error: null },
// );
//
// test(
//   recordClientRequest,
//   null,
//   null,
//   "before",
//   "after",
//   {
//     type: "client",
//     protocol: "HTTP/1.1",
//     method: "GET",
//     url: "/",
//     route: null,
//     headers: {},
//     body: null,
//   },
//   { type: "client", status: 200, message: "OK", headers: {}, body: null },
// );
//
// test(
//   recordClientRequest,
//   { headers: { key: "value" }, route: "route" },
//   null,
//   "before",
//   "after",
//   {
//     type: "client",
//     protocol: "HTTP/1.1",
//     method: "GET",
//     url: "/",
//     route: "route",
//     headers: { key: "value" },
//     body: null,
//   },
//   { type: "client", status: 200, message: "OK", headers: {}, body: null },
// );
