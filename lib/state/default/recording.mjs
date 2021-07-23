import Message from "./message.mjs";
import Serialization from "./serialization.mjs";

export default (dependencies) => {
  const {
    time: { now },
    util: {
      returnSecond,
      getBox,
      setBox,
      createBox,
      createCounter,
      incrementCounter,
    },
    serialization: { createSerialization, serialize, getSerializationEmptyValue },
  } = dependencies;
  const { messageEvent } = Message(dependencies);
  const generateRecord =
    (type1, type2, serializeData) =>
    ({ session, recording: { serialization, current_group } }, index, data) =>
      messageEvent(session, {
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
  return {
    createRecording: (options) => ({
      current_group: createBox(0),
      event_counter: createCounter(),
      serialization: createSerialization(options),
    }),
    setCurrentGroup: ({ recording: { current_group } }, group) => {
      setBox(current_group, group);
    },
    incrementEventCounter: ({ recording: { event_counter } }) =>
      incrementCounter(event_counter),
    getSerializationEmptyValue: ({ recording: { serialization } }) =>
      getSerializationEmptyValue(serialization),
    recordBeforeApply: generateRecord("before", "apply", serializeBeforeApply),
    recordAfterApply: generateRecord("after", "apply", serializeAfterApply),
    recordBeforeQuery: generateRecord("before", "query", returnSecond),
    recordAfterQuery: generateRecord("after", "query", returnSecond),
    recordBeforeRequest: generateRecord("before", "request", returnSecond),
    recordAfterRequest: generateRecord("after", "request", returnSecond),
    recordBeforeResponse: generateRecord("before", "response", returnSecond),
    recordAfterResponse: generateRecord("after", "response", returnSecond),
  };
};
