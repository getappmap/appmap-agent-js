
import Session from "./session.mjs";

export default (dependencies) => {
  const { openSession, closeSession, sendSession, awaitSession } = Session(dependencies);
  const make = (type) => (session, data) => sendSession(session, {type, data});
  return {
    openMessaging: openSession,
    closeMessaging: closeSession,
    awaitMessaging: awaitSession,
    messageEvent: make("event"),
    messageEntity: make("entity"),
    messageGroup: make("group"),
    messageControl: make("control"),
  };
};

//
// export default ({Client}) => {
//   const {openSession, closeSession, sendSession} = Session({Client});
//   const sendMessage = (type) => (session, data) => sendSession(session, {type, data});
//   return {
//     openMessaging: openSession,
//     closeMessaging, closeSession,
//     sendEventMessage: sendMessage("event"),
//     sendTrackMessage: sendMessage("track"),
//     sendEntityMessage: sendMessage("entity"),
//     sendGroupMessage: sendMessage("group"),
//   };
// };
