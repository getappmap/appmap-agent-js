import { assertDeepEqual } from "../../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../../build.mjs";
import Classmap from "../classmap/index.mjs";
import Event from "./index.mjs";

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { createClassmap, addClassmapSource } = Classmap(dependencies);
const { makeLocation, stringifyLocation } = await buildTestComponentAsync(
  "location",
);
const { createConfiguration } = await buildTestComponentAsync(
  "configuration",
  "test",
);
const { digestEventTrace } = Event(dependencies);

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
    createClassmap(createConfiguration("file:///home")),
  ).map(getEvent),
  [],
);

// apply //
for (const shallow of [true, false]) {
  {
    const classmap = createClassmap(createConfiguration("file:///home"));
    addClassmapSource(classmap, {
      url: "file:///home/filename.js",
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
    const location = makeLocation("file:///home/filename.js", 1, 0);
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
}

// missing apply //
{
  const location = makeLocation("file:///home/filename.js", 1, 0);
  assertDeepEqual(
    digestEventTrace(
      [
        {
          type: "bundle",
          begin: makeEvent("begin", 123, makeApplyPayload(location)),
          children: [],
          end: makeEvent("end", 123, makeReturnPayload(location)),
        },
      ],
      createClassmap(createConfiguration("file:///home")),
    ).map(getEvent),
    [],
  );
}
