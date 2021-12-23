import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Backend from "./index.mjs";

// const filterObject = (object, keys) => {
//   const result = {};
//   for (const key of keys) {
//     Reflect.defineProperty(result, key, {
//       __proto__: null,
//       writable: true,
//       enumerable: true,
//       configuration: true,
//       value: object[key],
//     });
//   }
//   return result;
// };

// const getCode = ({ code }) => code;
// const getLength = ({ length }) => length;

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration", "test");
const {
  createBackend,
  sendBackend,
  getBackendTrackIterator,
  getBackendTraceIterator,
  hasBackendTrace,
  hasBackendTrack,
  takeBackendTrace,
} = Backend(dependencies);

const configuration = extendConfiguration(
  createConfiguration("/cwd"),
  { name: "name1" },
  null,
);

{
  const backend = createBackend(configuration);
  assertEqual(
    sendBackend(backend, [
      "source",
      {
        url: "file:///cwd/main.js",
        content: "function main () {}",
        shallow: false,
        inline: false,
        exclude: [],
      },
    ]),
    false,
  );
  assertEqual(
    sendBackend(backend, [
      "start",
      "record",
      { path: null, data: { name: "name2" } },
    ]),
    false,
  );
  assertEqual(
    sendBackend(backend, ["event", "begin", 123, 0, "bundle", null]),
    false,
  );
  assertEqual(hasBackendTrace(backend, "record"), false);
  assertDeepEqual(Array.from(getBackendTrackIterator(backend)), ["record"]);
  assertEqual(
    sendBackend(backend, ["stop", "record", { status: 0, errors: [] }]),
    true,
  );
  assertDeepEqual(Array.from(getBackendTraceIterator(backend)), ["record"]);
  assertEqual(hasBackendTrack(backend, "record"), false);
  assertDeepEqual(takeBackendTrace(backend, "record"), {
    head: extendConfiguration(configuration, { name: "name2" }, null),
    body: {
      configuration: extendConfiguration(
        configuration,
        { name: "name2" },
        null,
      ),
      sources: [
        {
          url: "file:///cwd/main.js",
          content: "function main () {}",
          shallow: false,
          inline: false,
          exclude: [],
        },
      ],
      events: [
        {
          type: "begin",
          index: 123,
          time: 0,
          data: {
            type: "bundle",
          },
        },
      ],
      termination: {
        status: 0,
        errors: [],
      },
    },
  });
}
//
//
//
//
//   assertDeepEqual(
//     sendBackend(backend, [
//       "file",
//       {
//         index: 1,
//         shallow: false,
//         source: false,
//         exclude: [],
//         type: "script",
//         path: "/cwd/main.js",
//         code: "function main () {}",
//       },
//     ]),
//     [],
//   );
//   assertDeepEqual(
//     sendBackend(backend, [
//       "start",
//       "track1",
//       { path: null, data: { output: { basename: "basename" } } },
//     ]),
//     [],
//   );
//   assertDeepEqual(
//     sendBackend(backend, [
//       "start",
//       "track2",
//       { path: null, data: { output: null } },
//     ]),
//     [],
//   );
//   assertDeepEqual(
//     sendBackend(backend, [
//       "event",
//       "begin",
//       1,
//       0,
//       "apply",
//       {
//         function: "1/body/0",
//         this: {
//           type: "string",
//           print: "THIS",
//         },
//         arguments: [],
//       },
//     ]),
//     [],
//   );
//   assertDeepEqual(
//     sendBackend(backend, [
//       "event",
//       "end",
//       1,
//       0,
//       "apply",
//       {
//         error: null,
//         result: {
//           type: "string",
//           print: "RESULT",
//         },
//       },
//     ]),
//     [],
//   );
//   const trace = {
//     version: "1.6.0",
//     metadata: {
//       name: "name",
//       app: null,
//       labels: [],
//       language: {
//         name: "ecmascript",
//         version: "2020",
//         engine: "engine@0.0.0",
//       },
//       frameworks: [],
//       client: {
//         name: "@appland/appmap-agent-js",
//         version: "0.0.0",
//         url: "https://github.com/applandinc/appmap-agent-js",
//       },
//       recorder: { name: "process" },
//       recording: null,
//       git: null,
//       test_status: "succeeded",
//       exception: null,
//     },
//     classMap: [
//       {
//         type: "package",
//         name: "main.js",
//         children: [
//           {
//             type: "class",
//             name: "main",
//             children: [
//               {
//                 type: "function",
//                 name: "()",
//                 location: "main.js:1",
//                 static: false,
//                 labels: [],
//                 comment: null,
//                 source: null,
//               },
//             ],
//           },
//         ],
//       },
//     ],
//     events: [
//       {
//         event: "call",
//         thread_id: 0,
//         id: 1,
//         defined_class: "main",
//         method_id: "()",
//         path: "main.js",
//         lineno: 1,
//         static: false,
//         receiver: {
//           name: "this",
//           class: "string",
//           object_id: null,
//           value: "THIS",
//         },
//         parameters: [],
//       },
//       {
//         event: "return",
//         thread_id: 0,
//         id: 2,
//         parent_id: 1,
//         elapsed: 0,
//         return_value: {
//           name: "return",
//           class: "string",
//           object_id: null,
//           value: "RESULT",
//         },
//         exceptions: null,
//       },
//     ],
//   };
//   assertDeepEqual(
//     sendBackend(backend, [
//       "stop",
//       "track2",
//       {
//         errors: [],
//         status: 0,
//       },
//     ]),
//     [],
//   );
//   assertDeepEqual(
//     sendBackend(backend, [
//       "stop",
//       "track1",
//       {
//         errors: [],
//         status: 0,
//       },
//     ]),
//     [
//       {
//         path: "/cwd/tmp/appmap/basename.appmap.json",
//         data: trace,
//       },
//     ],
//   );
//   assertDeepEqual(
//     sendBackend(backend, [
//       "terminate",
//       {
//         errors: [],
//         status: 1,
//       },
//     ]),
//     [],
//   );
//   assertDeepEqual(closeBackend(backend), []);
//   assertEqual(isEmptyBackend(backend), false);
//   assertDeepEqual(
//     getCode(respondBackend(backend, "DELETE", "/track2", null)),
//     200,
//   );
// }
//
// // respondBackend //
// {
//   // const removeMessage = ({ message, ...rest }) => rest;
//   const backend = openBackend();
//   // Malformed Request //
//   assertEqual(getCode(respondBackend(backend, "PUT", "/track")), 400);
//   assertEqual(getCode(respondBackend(backend, "PUT", "")), 400);
//   // POST Before Initialization //
//   assertDeepEqual(getCode(respondBackend(backend, "POST", "/track")), 409);
//   // Initialization //
//   sendBackend(backend, ["initialize", configuration]);
//   sendBackend(backend, ["start", "track1", { path: null, data: {} }]);
//
//   // POST //
//   assertEqual(getCode(respondBackend(backend, "POST", "/track1", null)), 409);
//   assertEqual(getCode(respondBackend(backend, "POST", "/track2", null)), 200);
//   // Get //
//   assertDeepEqual(
//     filterObject(respondBackend(backend, "GET", "/track2", null), [
//       "code",
//       "body",
//     ]),
//     {
//       code: 200,
//       body: { enabled: true },
//     },
//   );
//   assertDeepEqual(
//     filterObject(respondBackend(backend, "GET", "/track3", null), [
//       "code",
//       "body",
//     ]),
//     {
//       code: 200,
//       body: { enabled: false },
//     },
//   );
//   // DELETE //
//   assertEqual(getCode(respondBackend(backend, "DELETE", "/track1", null)), 200);
//   assertEqual(getCode(respondBackend(backend, "DELETE", "/track2", null)), 200);
//   assertEqual(getCode(respondBackend(backend, "DELETE", "/track2", null)), 404);
//   // Termination //
//   assertEqual(getCode(respondBackend(backend, "POST", "/track3", null)), 200);
//   sendBackend(backend, ["start", "track4", { path: null, data: {} }]);
//   assertEqual(getLength(closeBackend(backend)), 1);
//   assertEqual(getCode(respondBackend(backend, "POST", "/track5", null)), 409);
//   assertEqual(isEmptyBackend(backend), false);
//   assertEqual(getCode(respondBackend(backend, "DELETE", "/track3", null)), 200);
//   assertEqual(isEmptyBackend(backend), true);
// }
