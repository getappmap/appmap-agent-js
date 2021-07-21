import Messaging from "./messaging.mjs";

export default (dependencies) => {
  const {
    time: { now, createCounter, incrementCounter },
    grouping: {createGrouping, getCurrentGrouping, takeGroupingBuffer, terminateGroup},
  } = dependencies;
  const { messageEvent, messageGroup } = Messaging(dependencies);
  const record = (messaging, grouping, type, index, data) => {
    const buffer = takeGroupingBuffer(grouping);
    if (buffer !== null) {
      messageGroup(buffer);
    }
    messageEvent(messaging, {
      type,
      index,
      group: getCurrentGrouping(),
      data,
      time: now(),
    });
  };
  return {
    initializeRecording: (messaging) => ({
      grouping: initializeGrouping(messaging, ),
      counter: createCounter()
    }),
    terminateRecording: ({grouping}) => {
      terminateGrouping(grouping);
    },
    recordBefore: (messaging, {grouping, counter}, data) => {
      const index = incrementCounter(counter);
      record(
        messaging,
        grouping,
        "before",
        index,
        data,
      );
      return index;
    },
    recordAfter: (messaging, {grouping}, index, data) => {
      record(
        messaging,
        grouping,
        "after",
        index,
        data
      );
    },
  };
};
