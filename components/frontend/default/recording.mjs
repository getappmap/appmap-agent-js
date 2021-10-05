import Protocol from "./protocol.mjs";

const { isArray, from: toArray } = Array;
const { fromEntries, entries: toEntries } = Object;

export default (dependencies) => {
  const {
    time: { now },
    util: { returnSecond, constant, createCounter, incrementCounter },
    serialization: {
      createSerialization,
      serialize,
      getSerializationEmptyValue,
    },
  } = dependencies;
  const { recordEventProtocol } = Protocol(dependencies);
  const returnNull = constant(null);
  const generateRecord =
    (type1, type2, serializeData) =>
    ({ recording: { serialization } }, index, data) =>
      recordEventProtocol(
        type1,
        index,
        now(),
        type2,
        serializeData(serialization, data),
      );
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
  return {
    createRecording: (configuration) => ({
      event_counter: createCounter(0),
      serialization: createSerialization(configuration),
    }),
    incrementEventCounter: ({ recording: { event_counter } }) =>
      incrementCounter(event_counter),
    getSerializationEmptyValue: ({ recording: { serialization } }) =>
      getSerializationEmptyValue(serialization),
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
