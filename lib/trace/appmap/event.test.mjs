import { strict as Assert } from "assert";
import { buildTestAsync } from "../../../src/build.mjs";
import Classmap from "./classmap.mjs";
import Event from "./event.mjs";

Error.stackTraceLimit = Infinity;

const {
  deepEqual: assertDeepEqual,
  // throws: assertThrows,
  // equal: assertEqual,
} = Assert;

const testAsync = async () => {
  const dependencies = await buildTestAsync({
    ...import.meta,
    deps: ["configuration"],
  });
  const {
    configuration: { createConfiguration },
  } = dependencies;
  const { createClassmap } = Classmap(dependencies);
  const { compileEventTrace } = Event(dependencies);
  const classmap = createClassmap(createConfiguration("/cwd"));
  const default_before_event = {
    type: "before",
    time: 0,
    index: null,
    data: { type: "test" },
  };
  const default_after_event = {
    type: "after",
    time: 0,
    index: null,
    data: { type: "test" },
  };
  const default_enter_event = {
    event: "call",
    thread_id: 0,
    id: null,
  };
  const default_leave_event = {
    event: "return",
    thread_id: 0,
    id: null,
    elapsed: 0,
    parent_id: null,
  };
  //////////////////
  // orderByFrame //
  //////////////////
  // sort return //
  assertDeepEqual(
    compileEventTrace(
      [
        { ...default_before_event, index: 1 },
        { ...default_before_event, index: 2 },
        { ...default_after_event, index: 1 },
        { ...default_after_event, index: 2 },
      ],
      classmap,
    ),
    [
      { ...default_enter_event, id: 2 },
      { ...default_enter_event, id: 4 },
      { ...default_leave_event, id: 5, parent_id: 4 },
      { ...default_leave_event, id: 3, parent_id: 2 },
    ],
  );
  // flip order //
  assertDeepEqual(
    compileEventTrace(
      [
        { ...default_after_event, index: 1 },
        { ...default_before_event, index: 2 },
        { ...default_after_event, index: 2 },
        { ...default_before_event, index: 1 },
      ],
      classmap,
    ),
    [
      { ...default_enter_event, id: 2 },
      { ...default_enter_event, id: 4 },
      { ...default_leave_event, id: 5, parent_id: 4 },
      { ...default_leave_event, id: 3, parent_id: 2 },
    ],
  );
  // manufacture missing event //
  assertDeepEqual(
    compileEventTrace(
      [
        { ...default_after_event, index: 1 },
        { ...default_before_event, index: 2 },
      ],
      classmap,
    ),
    [
      { ...default_enter_event, id: 2 },
      { ...default_enter_event, id: 4 },
      { ...default_leave_event, id: 5, parent_id: 4 },
      { ...default_leave_event, id: 3, parent_id: 2 },
    ],
  );
};

testAsync();
