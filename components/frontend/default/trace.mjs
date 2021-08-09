import Session from "./session.mjs";

export default (dependencies) => {
  const { sendSession } = Session(dependencies);
  const generateTrace = (type) => (session, data) =>
    sendSession(session, { type, data });
  return {
    traceEvent: generateTrace("event"),
    traceFile: generateTrace("file"),
    traceTrack: generateTrace("track"),
    traceGroup: generateTrace("group"),
  };
};
