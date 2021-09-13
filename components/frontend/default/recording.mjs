import Trace from "./trace.mjs";

const { isArray, from: toArray } = Array;
const { fromEntries, entries: toEntries } = Object;

export default (dependencies) => {
  const {
    time: { now },
    util: {
      returnSecond,
      constant,
      getBox,
      setBox,
      createBox,
      createCounter,
      incrementCounter,
    },
    serialization: {
      createSerialization,
      serialize,
      getSerializationEmptyValue,
    },
  } = dependencies;
  const { traceEvent } = Trace(dependencies);
  const returnNull = constant(null);
  const generateRecord =
    (type1, type2, serializeData) =>
    ({ session, recording: { serialization, current_group } }, index, data) =>
      traceEvent(session, {
        type: type1,
        index,
        data: {
          type: type2,
          ...serializeData(serialization, data),
        },
        group: getBox(current_group),
        time: now(),
      });
  const serializeBeforeApply = (
    serialization,
    { function: _function, this: _this, arguments: _arguments },
  ) => ({
    function: _function,
    this: serialize(serialization, _this),
    arguments: _arguments.map((argument) => serialize(serialization, argument)),
  });
  const serializeAfterApply = (serialization, { error, result }) => ({
    error: serialize(serialization, error),
    result: serialize(serialization, result),
  });
  const serializeBeforeQuery = (
    serialization,
    { database, version, sql, parameters },
  ) => ({
    database,
    version,
    sql,
    parameters: isArray(parameters)
      ? parameters.map((parameter) => serialize(serialization, parameter))
      : fromEntries(
          toArray(toEntries(parameters)).map(([name, parameter]) => [
            name,
            serialize(serialization, parameter),
          ]),
        ),
  });
  const serializeAfterQuery = (serialization, { error }) => ({
    error: serialize(serialization, error),
  });
  const wrapIndex = (serialization, index) => ({ index });
  return {
    createRecording: (configuration) => ({
      current_group: createBox(0),
      event_counter: createCounter(0),
      serialization: createSerialization(configuration),
    }),
    getCurrentGroup: ({ recording: { current_group } }) =>
      getBox(current_group),
    setCurrentGroup: ({ recording: { current_group } }, group) => {
      setBox(current_group, group);
    },
    incrementEventCounter: ({ recording: { event_counter } }) =>
      incrementCounter(event_counter),
    getSerializationEmptyValue: ({ recording: { serialization } }) =>
      getSerializationEmptyValue(serialization),
    // placeholder //
    recordPlaceholder: generateRecord("placeholder", "placeholder", wrapIndex),
    // bundle //
    recordBeginBundle: generateRecord("begin", "bundle", returnNull),
    recordEndBundle: generateRecord("end", "bundle", returnNull),
    recordBeginApply: generateRecord("begin", "apply", serializeBeforeApply),
    recordEndApply: generateRecord("end", "apply", serializeAfterApply),
    recordBeginResponse: generateRecord("begin", "response", returnSecond),
    recordEndResponse: generateRecord("end", "response", returnSecond),
    // jump //
    recordBeforeJump: generateRecord("before", "jump", returnNull),
    recordAfterJump: generateRecord("after", "jump", returnNull),
    recordBeforeRequest: generateRecord("before", "request", returnSecond),
    recordAfterRequest: generateRecord("after", "request", returnSecond),
    recordBeforeQuery: generateRecord("before", "query", serializeBeforeQuery),
    recordAfterQuery: generateRecord("after", "query", serializeAfterQuery),
  };
};
