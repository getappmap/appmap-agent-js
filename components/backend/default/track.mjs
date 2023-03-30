import { compileTrace } from "../../trace/index.mjs";
import {
  getSourceUrl,
  hashSource,
  isSourceEmpty,
} from "../../source/index.mjs";
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

const makeStaticKey = (url) => `|${url}`;

const makeDynamicKey = (url, hash) => `${hash}|${url}`;

export const addTrackSource = (track, source) => {
  track.sources.push(source);
  const url = getSourceUrl(source);
  const key1 = makeStaticKey(url);
  track.present.add(key1);
  track.missing.delete(key1);
  if (!isSourceEmpty(source)) {
    const hash = hashSource(source);
    const key2 = makeDynamicKey(url, hash);
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
        const { url, hash } = parseLocation(payload.function);
        const key1 = makeStaticKey(url);
        if (!track.present.has(key1)) {
          track.missing.add(key1);
        }
        if (hash !== null) {
          const key2 = makeDynamicKey(url, hash);
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
