import { strict as Assert } from "assert";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Completion from "./completion.mjs";

Error.stackTraceLimit = Infinity;

const {
  deepEqual: assertDeepEqual,
  // throws: assertThrows,
  // equal: assertEqual,
} = Assert;

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { ensureCompletion } = Completion(dependencies);
const makeMark = (data) => ({ type: "event", data });
const default_event = {
  type: null,
  time: 0,
  group: 1,
  index: null,
  data: null,
};

// general //
{
  const mark1 = makeMark({
    ...default_event,
    type: "begin",
    index: 1,
    data: { type: "bundle" },
  });
  const mark2 = makeMark({
    ...default_event,
    type: "begin",
    index: 2,
    data: { type: "bundle" },
  });
  const mark3 = makeMark({
    ...default_event,
    type: "after",
    group: null,
    index: 3,
    data: { type: "bundle" },
  });
  const mark4 = makeMark({
    ...default_event,
    type: "before",
    index: 4,
    data: { type: "bundle" },
  });
  const mark5 = makeMark({
    ...default_event,
    type: "end",
    index: 2,
    data: { type: "bundle" },
  });
  const mark6 = makeMark({
    ...default_event,
    type: "end",
    index: 1,
    data: { type: "bundle" },
  });
  const mark7 = makeMark({
    ...default_event,
    type: "after",
    index: 4,
    group: null,
    data: { type: "jump" },
  });
  const trace = [mark1, mark2, mark3, mark4, mark5, mark6, mark7];
  ensureCompletion(trace);
  assertDeepEqual(trace, [
    mark1,
    mark2,
    mark3,
    mark4,
    mark5,
    mark6,
    {
      type: "event",
      data: {
        ...mark7.data,
        group: Number.MAX_SAFE_INTEGER,
      },
    },
    makeMark({
      ...default_event,
      type: "before",
      index: Number.MAX_SAFE_INTEGER - 1,
      group: Number.MAX_SAFE_INTEGER,
      data: { type: "jump" },
    }),
  ]);
}
