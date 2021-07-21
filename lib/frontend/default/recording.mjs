import Messaging from "./messaging.mjs";

export default (dependencies) => {
  const {
    time: { now },
    util: { createCounter, incrementCounter },
    grouping: { initializeGrouping, getCurrentGroup, terminateGrouping },
  } = dependencies;
  const { messageEvent } = Messaging(dependencies);
  const record = (messaging, grouping, type, index, data) => {
    messageEvent(messaging, {
      type,
      index,
      group: getCurrentGroup(grouping),
      data,
      time: now(),
    });
  };
  return {
    initializeRecording: (options) => ({
      grouping: initializeGrouping(options),
      counter: createCounter(),
    }),
    terminateRecording: ({ grouping }) => {
      terminateGrouping(grouping);
    },
    recordBefore: (messaging, { grouping, counter }, data) => {
      const index = incrementCounter(counter);
      record(messaging, grouping, "before", index, data);
      return index;
    },
    recordAfter: (messaging, { grouping }, index, data) => {
      record(messaging, grouping, "after", index, data);
    },
  };
};
