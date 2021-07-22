import Session from "./session.mjs";

export default (dependencies) => {
  const {
    sendSession,
  } = Session(dependencies);
  const generateMessage = (type) => (session, data) => sendSession(session, { type, data });
  return {
    messageEvent: generateMessage("event"),
    messageEntity: generateMessage("entity"),
    messageTrack: generateMessage("track"),
    messageGroup: generateMessage("group"),
  };
};
