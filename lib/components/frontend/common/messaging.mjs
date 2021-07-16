
import Session from "./session.mjs";

export default ({Client}) => {
  const {initializeSession, terminateSession, sendSession} = Session({Client});
  const sendMessage = (type) => (session, data) => sendSession(session, {type, data});
  return {
    initializeMessaging: initializeSession,
    terminateMessaging, terminateSession,
    sendEventMessage: sendMessage("event"),
    sendTrackMessage: sendMessage("track"),
    sendEntityMessage: sendMessage("entity"),
    sendGroupMessage: sendMessage("group"),
  };
};
