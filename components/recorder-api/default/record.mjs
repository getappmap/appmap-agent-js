// const { isArray } = Array;
// const { ownKeys } = Reflect;
// const _undefined = undefined;
//
// const STRICT = false;
//
// export default (dependencies) => {
//   const {
//     expect: { expect },
//     agent: {
//       getFreshTab,
//       getSerializationEmptyValue,
//       recordBeginBundle,
//       recordBeginApply,
//       recordBeginServer,
//       recordBeforeJump,
//       recordBeforeClient,
//       recordBeforeQuery,
//       recordEndBundle,
//       recordEndApply,
//       recordEndServer,
//       recordAfterJump,
//       recordAfterClient,
//       recordAfterQuery,
//     },
//   } = dependencies;
//   const expectType = (location, object, key, type) => {
//     expect(
//       typeof object[key] === type,
//       "%s.%s should be a %s, got: %j",
//       location,
//       key,
//       type,
//       object,
//     );
//   };
//   const expectNonNull = (location, object, key) => {
//     expect(
//       object[key] !== null,
//       "%s.%s should be non null, got: %j",
//       location,
//       key,
//       object,
//     );
//   };
//   const expectArray = (location, object, key) => {
//     expect(
//       isArray(object[key]),
//       "%s.%s should be an array, got: %j",
//       location,
//       key,
//       object,
//     );
//   };
//   const expectHeaders = (location, object, key) => {
//     expectNonNull(location, object, key);
//     expectType(location, object, key, "object");
//     const next_location = `${location}.${key}`;
//     const next_object = object[key];
//     for (const next_key of ownKeys(next_object)) {
//       expectType(next_location, next_object, next_key, "string");
//     }
//   };
//   const sanitizeVoid = (empty, data) => [];
//   const generateSanitizeRequest = (location) => (empty, data) => {
//     data = {
//       protocol: "HTTP/1.1",
//       method: "GET",
//       url: "/",
//       headers: {},
//       route: null,
//       body: empty,
//       ...data,
//     };
//     expectType(location, data, "protocol", "string");
//     expectType(location, data, "method", "string");
//     expectType(location, data, "url", "string");
//     expectHeaders(location, data, "headers");
//     if (data.route !== null) {
//       expectType(location, data, "route", "string");
//     }
//     return [
//       data.protocol,
//       data.method,
//       data.url,
//       data.route,
//       data.headers,
//       data.body,
//     ];
//   };
//   const generateSanitizeResponse = (location) => (empty, data) => {
//     data = {
//       status: 200,
//       message: "OK",
//       headers: {},
//       body: empty,
//       ...data,
//     };
//     expectType(location, data, "status", "number");
//     expectType(location, data, "message", "string");
//     expectHeaders(location, data, "headers");
//     return [data.status, data.message, data.headers, data.body];
//   };
//   const generateRecord =
//     (enter, sanitizeEnter, leave, sanitizeLeave) => (agent, data) => {
//       const empty = getSerializationEmptyValue(agent);
//       let tab = getFreshTab(agent);
//       enter(agent, STRICT, tab, ...sanitizeEnter(empty, data));
//       return (data) => {
//         expect(tab !== null, "event has already been closed");
//         leave(agent, STRICT, tab, ...sanitizeLeave(empty, data));
//         tab = null;
//       };
//     };
//   return {
//     recordBeginBundle: generateRecord(
//       recordBeginBundle,
//       sanitizeVoid,
//       recordEndBundle,
//       sanitizeVoid,
//     ),
//     recordApply: generateRecord(
//       recordBeginApply,
//       (empty, data) => {
//         data = {
//           this: _undefined,
//           arguments: [],
//           ...data,
//           function: null,
//         };
//         expectArray("BeginApplyEvent", data, "arguments");
//         return [data.function, data.this, data.arguments];
//       },
//       recordEndApply,
//       (empty, data) => {
//         data = {
//           error: empty,
//           result: empty,
//           ...data,
//         };
//         expect(
//           (data.error === empty) !== (data.result === empty),
//           "EndApplyEvent should either contain 'error' for failure or 'result' for success, got: %j",
//           data,
//         );
//         return [data.error, data.result];
//       },
//     ),
//     recordServerRequest: generateRecord(
//       recordBeginServer,
//       generateSanitizeRequest("BeginResponseEvent"),
//       recordEndServer,
//       generateSanitizeResponse("EndResponseEvent"),
//     ),
//     recordBeforeJump: generateRecord(
//       recordBeforeJump,
//       sanitizeVoid,
//       recordAfterJump,
//       sanitizeVoid,
//     ),
//     recordQuery: generateRecord(
//       recordBeforeQuery,
//       (empty, data) => {
//         data = {
//           database: "unknown",
//           version: "unknown",
//           sql: "unknown",
//           parameters: [],
//           ...data,
//         };
//         expectNonNull("BeforeQueryEvent", data, "parameters");
//         expectType("BeforeQueryEvent", data, "parameters", "object");
//         return [data.database, data.version, data.sql, data.parameters];
//       },
//       recordAfterQuery,
//       (empty, data) => {
//         data = {
//           error: empty,
//           ...data,
//         };
//         return [data.error];
//       },
//     ),
//     recordClientRequest: generateRecord(
//       recordBeforeClient,
//       generateSanitizeRequest("BeforeRequestEvent"),
//       recordAfterClient,
//       generateSanitizeResponse("AfterRequestEvent"),
//     ),
//   };
// };
