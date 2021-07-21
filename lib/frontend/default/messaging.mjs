import Session from "./session.mjs";

export default (dependencies) => {
  const {
    initializeSession,
    terminateSession,
    sendSession,
    asyncSessionTermination,
  } = Session(dependencies);
  const generateMessage = (type) => (session, data) => {
    sendSession(session, { type, data });
  };
  return {
    initializeMessaging: initializeSession,
    terminateMessaging: terminateSession,
    asyncMessagingTermination: asyncSessionTermination,
    messageEvent: generateMessage("event"),
    messageEntity: generateMessage("entity"),
    messageTrack: generateMessage("track"),
  };
};
