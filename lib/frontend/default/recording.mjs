import Messaging from "./messaging.mjs";
import Serialization from "./serialization.mjs";

export default (dependencies) => {
  const {
    time: { now },
    util: { returnSecond },
    "apply-hook": {getBeforeApplyStream, getAfterApplyStream},
    "query-hook": {getBeforeQueryStream, getAfterQueryStream},
    "request-hook": {getBeforeRequestStream, getAfterRequestStream},
    "response-hook": {getBeforeResponseStream, getAfterRequestStream},
  } = dependencies;
  const { messageEvent } = Messaging(dependencies);
  const { serialize } = Serialization(dependencies);
  const generateRecord = (kind, type, serializeData) => ({session, recording:{serialization, current_group}}, index, data) => messageEvent(
    session,
    {
      kind,
      type,
      index,
      data: serializeData(serialization, data),
      group: getBox(current_group),
      time: now(),
    },
  );
  const serializeBeforeApply = (serialization, {function:_function, this:_this, arguments:_arguments}) => ({
    function: _function,
    this: serialize(_this),
    arguments: _arguments.map((argument) => serialize(serializataion, argument)),
  });
  const serializeAfterApply = (serialization, {function:_function, this:_this, arguments:_arguments}) => ({
    function: _function,
    this: serialize(_this),
    arguments: _arguments.map((argument) => serialize(serializataion, argument)),
  });
  return {
    createRecording: (options) => ({
      current_group: createBox(0),
      event_counter: createCounter(),
      serialization: createSerialization(options),
    }),
    setCurrentGroup: ({current_group}, group) => {
      setBox(current_group, group);
    },
    incrementEventCounter: ({event_counter}) => incrementCounter(event_counter),
    getSerializationEmptyValue: ({serialization}) => getSerializationEmptyValue(serialization),
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
