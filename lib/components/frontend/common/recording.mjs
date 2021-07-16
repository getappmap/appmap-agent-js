
import Messaging from "./messaging.mjs";
const global_WeakSet = WeakMap;
const {now:global_Date_now} = Date;

export default = ({Client, Grouping:{initializeGrouping, terminateGrouping, getCurrentGroup}}) => {
  const {initializeMessaging, terminateMessaging, messageEvent, messageEntity, messageTrack, messageGroup} = Messaging({Client});
  const getCurrentGroupIndex = ({messaging, grouping, cache}) => {
    const group = getCurrentGroup(grouping);
    if (!cache.has(group)) {
      cache.add(group);
      messageGroup(messaging, group);
    }
    const {index} = group;
    return index;
  },
  return {
    initializeRecording: (options) => {
      cache: new global_WeakSet(),
      counter: createCounter(),
      grouping: initializeGrouping(),
      messaging: initializeMessaging(options),
    },
    terminateRecording: ({grouping, messaging}) => {
      terminateGrouping(grouping);
      terminateMessaging(messaging);
    },
    recordTrack: ({messaging}, data) => {
      messageTrack(messaging, data);
    },
    recordEntity: ({messaging}, data) => {
      messageEntity(messaging, data);
    },
    recordBeforeEvent: (recording, data) => {
      const {messaging, counter} = recording;
      const index = incrementCounter(counter);
      messageEvent(
        messaging,
        {
          type: "before",
          time: global_Date_now(),
          index,
          group: getCurrentGroupIndex(recording),
          data,
        }
      );
      return index;
    },
    recordAfterEvent: (recording, index, data) => {
      const {session} = recording;
      messageEvent(
        session,
        {
          type: "after",
          time: global_Date_now(),
          index,
          group: getCurrentGroupIndex(recording),
          data,
        }
      );
    },
  };
};

//     recordBeforeApply: (recording, _function, _this, _arguments) => {
//       const {serialization} = recording;
//       return recordBefore(
//         recording,
//         {
//           type: "apply",
//           function: _function,
//           this: serialize(serialization, _this),
//           arguments: _arguments.map((argument) => serialize(serialization, argument)),
//         },
//       );
//     },
//     recordAfterApply: (recording, index, result, error) => {
//       const {serialization} = recording;
//       return recordAfter(
//         recording,
//         index,
//         {
//           type: "apply",
//           result: serialize(recording.serializer, result),
//           error: serializeError(recording.serializer, error),
//         },
//       );
//     },
//     recordBeforeQuery: (recording, database, sql, parameters) => recordBefore(
//       recording,
//       {
//         type: "query",
//         database,
//         sql,
//         parameters,
//       },
//     );
//     recordAfterQuery: (recording, index) => recordAfter(recording, index, {type:"query"}),
//     recordingBeforeRequest: (recording, method, url, headers) => recordBefore(
//       recording,
//       {
//         type: "request",
//         method,
//         url,
//         headers,
//       },
//     ),
//     recordingAfterRequest: (recording, index, status, message, headers) => recordAfter(
//       recording,
//       index,
//       {
//         type: "request",
//         status,
//         message,
//         headers,
//       },
//     ),
//     recordBeforeResponse: (recording, status, message, headers) => recordBefore(
//       recording,
//       {
//         type: "response",
//         status,
//         message,
//         headers,
//       },
//     ),
//     recordAfterResponse = (recording, index, method, url, headers) => recordAfter(
//       recording,
//       index,
//       {
//         type: "response",
//         method,
//         url,
//         headers,
//       },
//     ),
//   };
// };
