import Recording from "./recording.mjs";
import Track from "./track.mjs";
import Messaging from "./messaging.mjs";
import Serialization from "./serialization.mjs";

const getMessaging = ({ messaging }) => messaging;
const getInstrumentation = ({ instrumentation }) => instrumentation;
const getSerialization = ({ serialization }) => serialization;

export default (dependencies) => {
  const {
    util: { createCounter, incrementCounter },
    uuid: { getUUID },
    instrumentation: {
      createInstrumentation,
      instrument,
      getInstrumentationIdentifier,
    },
  } = dependencies;
  const { createSerialization, getSerializationEmptyValue } =
    Serialization(dependencies);
  const { messageEntity, messageGroup } = Messaging(dependencies);
  const {createTrack, ... TrackLibrary } = Track(dependencies);
  const EventLibrary = Event(dependencies);
  return {
    createFrontend: (options) => ({
      current_group: createBox(),
      track_counter: createCounter(),
      event_counter: createCounter(),
      serialization: createSerialization(options);
      instrumentation: createInstrumentation(options),
      session: createSession(getUUID(), options),
    }),
    setCurrentGroup: ({current_group}) => {
      setBox(current_group, )
    },
    createTrack: ({track_counter}) => createTrack(incrementCounter(track_counter)),
    declareGroup: ({session}, group) => messageGroup(session, group),
    incrementEventCounter: ({event_counter}) => incrementCounter(event_counter),
    getInstrumentationIdentifier: ({instrumentation}) => getInstrumentationIdentifier(instrumentation),
    getSerializationEmptyValue: ({serialization}) => getSerializationEmptyValue(serialization),
    initializeFrontend: ({session}) => initializeSession(session),
    terminateFrontend: ({session}) => terminateSession(session),
    instrument: ({ instrumentation, session }, kind, path, code1) => {
      const { code: code2, entity } = instrument(
        instrumentation,
        kind,
        path,
        code1,
      );
      return {
        message: entity === null ? null : messageEntity(session, entity),
        code: code2,
      };
    },
    ... TrackLibrary,
    ... EventLibrary,
  };
};
