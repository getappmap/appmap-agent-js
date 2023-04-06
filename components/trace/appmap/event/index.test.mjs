import { assertDeepEqual } from "../../../__fixture__.mjs";
import { stringifyLocation } from "../../../location/index.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../../configuration/index.mjs";
import { createClassmap, addClassmapSource } from "../../../classmap/index.mjs";
import { digestEventTrace } from "./index.mjs";

const makeEvent = (site, tab, payload) => ({
  type: "event",
  session: "session",
  site,
  tab,
  time: 0,
  group: 0,
  payload,
});

const makeApplyPayload = (location) => ({
  type: "apply",
  function: location,
  this: null,
  arguments: [
    {
      type: "string",
      print: '"arg0"',
    },
  ],
});

const makeReturnPayload = (location) => ({
  type: "return",
  function: location,
  result: {
    type: "number",
    print: 123,
  },
});

const makeRequestPayload = (side) => ({
  type: "request",
  side,
  protocol: "HTTP/1.1",
  method: "GET",
  url: "/",
  route: null,
  headers: {},
  body: null,
});

const makeResponsePayload = (side) => ({
  type: "response",
  side,
  status: 200,
  message: "OK",
  headers: {},
  body: null,
});

const makeJumpPayload = () => ({ type: "jump" });

const makeBundlePayload = () => ({ type: "bundle" });

const makeQueryPayload = () => ({
  type: "query",
  database: "database",
  version: null,
  sql: "SELECT * FROM table;",
  parameters: {},
});

const makeAnswerPayload = () => ({
  type: "answer",
});

const getEvent = ({ event }) => event;

// transparent event //
assertDeepEqual(
  digestEventTrace(
    [
      {
        type: "bundle",
        begin: makeEvent("begin", 123, makeBundlePayload()),
        children: [
          {
            type: "jump",
            before: makeEvent("before", 456, makeJumpPayload()),
            after: makeEvent("after", 456, makeAnswerPayload()),
          },
        ],
        end: makeEvent("end", 123, makeBundlePayload()),
      },
    ],
    createClassmap(createConfiguration("protocol://host/home")),
  ).map(getEvent),
  [],
);

// apply //
for (const shallow of [true, false]) {
  const classmap = createClassmap(
    extendConfiguration(
      createConfiguration("protocol://host/home"),
      {
        packages: [
          {
            glob: "*.js",
            "inline-source": false,
            shallow,
          },
        ],
      },
      "protocol://host/home/",
    ),
  );
  addClassmapSource(classmap, {
    url: "protocol://host/home/filename.js",
    content: "function f (x) {}",
    hash: "hash",
  });
  const location = stringifyLocation({
    url: "protocol://host/home/filename.js",
    hash: null,
    position: { line: 1, column: 0 },
  });
  assertDeepEqual(
    digestEventTrace(
      [
        {
          type: "bundle",
          begin: makeEvent("begin", 123, makeApplyPayload(location)),
          children: [
            {
              type: "jump",
              before: makeEvent("before", 456, makeQueryPayload()),
              after: makeEvent("after", 456, makeAnswerPayload()),
            },
          ],
          end: makeEvent("end", 123, makeReturnPayload(location)),
        },
      ],
      classmap,
    ).map(getEvent),
    shallow ? ["call", "return"] : ["call", "call", "return", "return"],
  );
}

// missing apply >> transparent //
{
  const location = stringifyLocation({
    url: "protocol://host/home/filename.js",
    hash: null,
    position: { line: 1, column: 0 },
  });
  const bundle = {
    type: "bundle",
    begin: makeEvent("begin", 123, makeApplyPayload(location)),
    children: [
      {
        type: "jump",
        before: makeEvent("before", 456, makeQueryPayload()),
        after: makeEvent("after", 456, makeAnswerPayload()),
      },
    ],
    end: makeEvent("end", 123, makeReturnPayload(location)),
  };
  assertDeepEqual(
    digestEventTrace(
      // double bundle to exercise cache
      [bundle, bundle],
      createClassmap(createConfiguration("protocol://host/home")),
    ).map(getEvent),
    ["call", "return", "call", "return"],
  );
}

// server apply >> deep //
assertDeepEqual(
  digestEventTrace(
    [
      {
        type: "bundle",
        begin: makeEvent("begin", 123, makeRequestPayload("server")),
        children: [
          {
            type: "jump",
            before: makeEvent("before", 456, makeQueryPayload()),
            after: makeEvent("after", 456, makeAnswerPayload()),
          },
        ],
        end: makeEvent("end", 123, makeResponsePayload("server")),
      },
    ],
    createClassmap(createConfiguration("protocol://host/home")),
  ).map(getEvent),
  ["call", "call", "return", "return"],
);
