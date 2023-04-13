import { compileTrace } from "../../trace/index.mjs";
import { parseLocation } from "../../location/index.mjs";

const { RegExp, Set } = globalThis;

export const startTrack = (configuration) => ({
  configuration,
  regexp: new RegExp(configuration.sessions, "u"),
  sources: [],
  messages: [],
  termination: null,
  present: new Set(),
  missing: new Set(),
});

export const stopTrack = (track, termination) => {
  track.termination = termination;
};

export const compileTrack = (track) =>
  compileTrace(
    track.configuration,
    track.sources,
    track.messages,
    track.termination ?? { type: "unknown" },
  );

const makeStaticKey = ({ url }) => `|${url}`;

const makeDynamicKey = ({ url, hash }) => `${hash}|${url}`;

export const addTrackSource = (track, source) => {
  track.sources.push(source);
  const key1 = makeStaticKey(source);
  track.present.add(key1);
  track.missing.delete(key1);
  if (source.hash !== null) {
    const key2 = makeDynamicKey(source);
    track.present.add(key2);
    track.missing.delete(key2);
  }
};

export const sendTrack = (track, message) => {
  const { type, session } = message;
  if (track.regexp.test(session)) {
    if (type === "amend" || track.termination === null) {
      track.messages.push(message);
    }
    if (type === "event") {
      const { payload } = message;
      const { type: payload_type } = payload;
      if (
        payload_type === "apply" ||
        payload_type === "return" ||
        payload_type === "throw"
      ) {
        const location = parseLocation(payload.function);
        const key1 = makeStaticKey(location);
        if (!track.present.has(key1)) {
          track.missing.add(key1);
        }
        if (location.hash !== null) {
          const key2 = makeDynamicKey(location);
          if (!track.present.has(key2)) {
            track.missing.add(key2);
          }
        }
      }
    }
  }
};

export const isTrackComplete = (track) =>
  track.termination !== null && track.missing.size === 0;
