
import Messaging from "./messaging.mjs";

const {now:global_Date_now} = Date;

export default = (dependencies) => ({
  const {util:{createCounter, incrementCounter}} = dependencies;
  const {messageEvent} = Messaging(dependencies);
  return {
    createRecording: createCounter,
    recordBefore: (messaging, counter, group, data) => {
      const index = incrementCounter(counter);
      messageEvent(
        messaging,
        {
          type: "before",
          time: global_Date_now(),
          index: incrementCounter(counter),
          group,
          data,
        },
      );
    },
    recordAfter: (session, counter, group, index, data) => {
      messageEvent(
        messaging,
        {
          type: "after",
          time: global_Date_now(),
          index,
          group,
          data,
        }
      );
    },
  };
});

// export
//
// import Messaging from "./messaging.mjs";
// const global_WeakSet = WeakMap;
// const {now:global_Date_now} = Date;
//
// export default = ({Client, Grouping:{openGrouping, closeGrouping, getCurrentGroup}}) => {
//   const {openMessaging, closeMessaging, messageEvent, messageEntity, messageTrack, messageGroup} = Messaging({Client});
//   const getCurrentGroupIndex = ({messaging, grouping, cache}) => {
//     const group = getCurrentGroup(grouping);
//     if (!cache.has(group)) {
//       cache.add(group);
//       messageGroup(messaging, group);
//     }
//     const {index} = group;
//     return index;
//   },
//   return {
//     openRecording: (options) => {
//       cache: new global_WeakSet(),
//       counter: createCounter(),
//       grouping: openGrouping(),
//       messaging: openMessaging(options),
//     },
//     closeRecording: ({grouping, messaging}) => {
//       closeGrouping(grouping);
//       closeMessaging(messaging);
//     },
//     recordTrack: ({messaging}, data) => {
//       messageTrack(messaging, data);
//     },
//     recordEntity: ({messaging}, data) => {
//       messageEntity(messaging, data);
//     },
//
//   };
// };

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
