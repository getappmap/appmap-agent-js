import Session from "./session.mjs";

export default (dependencies) => {
  const { traceSession } = Session(dependencies);
  const generateTrace = (type) => (session, data) =>
    traceSession(session, { type, data });
  return {
    traceEvent: generateTrace("event"),
    traceFile: generateTrace("file"),
    traceTrack: generateTrace("track"),
    traceGroup: generateTrace("group"),
  };
};
