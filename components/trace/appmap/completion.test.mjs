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
    group: 1,
    data: { type: "bundle" },
  });
  const mark2 = makeMark({
    ...default_event,
    type: "end",
    index: 1,
    group: 1,
    data: { type: "bundle" },
  });
  const mark3 = makeMark({
    ...default_event,
    type: "after",
    group: 2,
    index: 2,
    data: { type: "bundle" },
  });
  const trace = [mark1, mark2, mark3];
  ensureCompletion(trace);
  assertDeepEqual(trace, [
    mark1,
    mark2,
    mark3,
    makeMark({
      ...default_event,
      type: "before",
      group: 2,
      index: Number.MAX_SAFE_INTEGER - 1,
      data: { type: "jump" },
    }),
  ]);
}
