import { assertDeepEqual } from "../../../__fixture__.mjs";
import {
  makeLocation,
  stringifyLocation,
} from "../../../location/index.mjs?env=test";
import { createConfiguration } from "../../../configuration/index.mjs?env=test";
import {
  createClassmap,
  addClassmapSource,
} from "../classmap/index.mjs?env=test";
import { digestEventTrace } from "./index.mjs?env=test";

const makeEvent = (site, tab, payload) => ({
  type: "event",
  site,
  tab,
  time: 0,
  group: 0,
  payload,
});

const makeApplyPayload = (location) => ({
  type: "apply",
  function: stringifyLocation(location),
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
  function: stringifyLocation(location),
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
  const classmap = createClassmap(createConfiguration("protocol://host/home"));
  addClassmapSource(classmap, {
    url: "protocol://host/home/filename.js",
    content: "function f (x) {}",
    inline: false,
    exclude: [
      {
        combinator: "or",
        "every-label": true,
        "some-label": true,
        "qualified-name": true,
        name: true,
        excluded: false,
        recursive: true,
      },
    ],
    shallow,
  });
  const location = makeLocation("protocol://host/home/filename.js", 1, 0);
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
  const location = makeLocation("protocol://host/home/filename.js", 1, 0);
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
      createClassmap(createConfiguration("protocol://host/home")),
    ).map(getEvent),
    ["call", "return"],
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
