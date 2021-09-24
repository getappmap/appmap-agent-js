import { strict as Assert } from "assert";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Session from "./session.mjs";

Error.stackTraceLimit = Infinity;

const {
  equal: assertEqual,
  deepEqual: assertDeepEqual,
  // throws: assertThrows
} = Assert;

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration", "test");
const {
  openSession,
  sendSession,
  closeSession,
  isEmptySession,
  respondSession,
} = Session(dependencies);

const configuration = extendConfiguration(
  createConfiguration("/cwd"),
  { name: "name" },
  null,
);

assertDeepEqual(closeSession(openSession()), []);

// sendSession //
{
  const session = openSession();
  assertDeepEqual(sendSession(session, ["initialize", configuration]), []);
  assertDeepEqual(
    sendSession(session, [
      "file",
      {
        index: 1,
        shallow: false,
        source: false,
        exclude: [],
        type: "script",
        path: "/cwd/main.js",
        code: "function main () {}",
      },
    ]),
    [],
  );
  assertDeepEqual(
    sendSession(session, [
      "start",
      "track1",
      { path: null, data: { output: { basename: "basename" } } },
    ]),
    [],
  );
  assertDeepEqual(
    sendSession(session, [
      "start",
      "track2",
      { path: null, data: { output: null } },
    ]),
    [],
  );
  assertDeepEqual(
    sendSession(session, [
      "event",
      "begin",
      1,
      0,
      "apply",
      {
        function: "1/body/0",
        this: {
          type: "string",
          print: "THIS",
        },
        arguments: [],
      },
    ]),
    [],
  );
  assertDeepEqual(
    sendSession(session, [
      "event",
      "end",
      1,
      0,
      "apply",
      {
        error: null,
        result: {
          type: "string",
          print: "RESULT",
        },
      },
    ]),
    [],
  );
  const trace = {
    version: "1.6.0",
    metadata: {
      name: "name",
      app: null,
      labels: [],
      language: {
        name: "ecmascript",
        version: "2020",
        engine: "engine@0.0.0",
      },
      frameworks: [],
      client: {
        name: "@appland/appmap-agent-js",
        version: "0.0.0",
        url: "https://github.com/applandinc/appmap-agent-js",
      },
      recorder: { name: "process" },
      recording: null,
      git: null,
      test_status: "succeeded",
      exception: null,
    },
    classMap: [
      {
        type: "package",
        name: "main.js",
        children: [
          {
            type: "class",
            name: "main",
            children: [
              {
                type: "function",
                name: "()",
                location: "main.js:1",
                static: false,
                labels: [],
                comment: null,
                source: null,
              },
            ],
          },
        ],
      },
    ],
    events: [
      {
        event: "call",
        thread_id: 0,
        id: 1,
        defined_class: "main",
        method_id: "()",
        path: "main.js",
        lineno: 1,
        static: false,
        receiver: {
          name: "this",
          class: "string",
          object_id: null,
          value: "THIS",
        },
        parameters: [],
      },
      {
        event: "return",
        thread_id: 0,
        id: 2,
        parent_id: 1,
        elapsed: 0,
        return_value: {
          name: "return",
          class: "string",
          object_id: null,
          value: "RESULT",
        },
        exceptions: null,
      },
    ],
  };
  assertDeepEqual(
    sendSession(session, [
      "stop",
      "track2",
      {
        errors: [],
        status: 0,
      },
    ]),
    [],
  );
  assertDeepEqual(
    sendSession(session, [
      "stop",
      "track1",
      {
        errors: [],
        status: 0,
      },
    ]),
    [
      {
        path: "/cwd/tmp/appmap/basename.appmap.json",
        data: trace,
      },
    ],
  );
  assertDeepEqual(
    sendSession(session, [
      "terminate",
      {
        errors: [],
        status: 1,
      },
    ]),
    [],
  );
  assertDeepEqual(closeSession(session), []);
  assertEqual(isEmptySession(session), false);
  assertDeepEqual(respondSession(session, "DELETE", "/track2", null), {
    code: 200,
    message: null,
    storables: [],
    body: trace,
  });
}

// respondSession //
{
  const removeMessage = ({ message, ...rest }) => rest;
  const getCode = ({ code }) => code;
  const getLength = ({ length }) => length;
  const session = openSession();
  // Malformed Request //
  assertEqual(getCode(respondSession(session, "PUT", "/track")), 400);
  assertEqual(getCode(respondSession(session, "PUT", "")), 400);
  // POST Before Initialization //
  assertDeepEqual(getCode(respondSession(session, "POST", "/track")), 409);
  // Initialization //
  sendSession(session, ["initialize", configuration]);
  sendSession(session, ["start", "track1", { path: null, data: {} }]);

  // POST //
  assertEqual(getCode(respondSession(session, "POST", "/track1", null)), 409);
  assertEqual(getCode(respondSession(session, "POST", "/track2", null)), 200);
  // Get //
  assertDeepEqual(
    removeMessage(respondSession(session, "GET", "/track2", null)),
    {
      storables: [],
      code: 200,
      body: { enabled: true },
    },
  );
  assertDeepEqual(
    removeMessage(respondSession(session, "GET", "/track3", null)),
    {
      storables: [],
      code: 200,
      body: { enabled: false },
    },
  );
  // DELETE //
  assertEqual(getCode(respondSession(session, "DELETE", "/track1", null)), 200);
  assertEqual(getCode(respondSession(session, "DELETE", "/track2", null)), 200);
  assertEqual(getCode(respondSession(session, "DELETE", "/track2", null)), 404);
  // Termination //
  assertEqual(getCode(respondSession(session, "POST", "/track3", null)), 200);
  sendSession(session, ["start", "track4", { path: null, data: {} }]);
  assertEqual(getLength(closeSession(session)), 1);
  assertEqual(getCode(respondSession(session, "POST", "/track5", null)), 409);
  assertEqual(isEmptySession(session), false);
  assertEqual(getCode(respondSession(session, "DELETE", "/track3", null)), 200);
  assertEqual(isEmptySession(session), true);
}
