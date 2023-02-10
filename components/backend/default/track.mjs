import { compileTrace } from "../../trace/index.mjs";
import {
  getSourceUrl,
  hashSource,
  isSourceEmpty,
} from "../../source/index.mjs";
import { parseLocation } from "../../location/index.mjs";

const { Set } = globalThis;

export const startTrack = (configuration) => ({
  configuration,
  sources: [],
  messages: [],
  termination: null,
  present_url_set: new Set(),
  missing_url_set: new Set(),
  present_hash_set: new Set(),
  missing_hash_set: new Set(),
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

export const addTrackSource = (track, source) => {
  track.sources.push(source);
  const url = getSourceUrl(source);
  track.present_url_set.add(url);
  track.missing_url_set.delete(url);
  if (!isSourceEmpty(source)) {
    const hash = hashSource(source);
    track.present_hash_set.add(hash);
    track.missing_hash_set.delete(hash);
  }
};

export const sendTrack = (track, message) => {
  const { type } = message;
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
      if (url !== null && !track.present_url_set.has(url)) {
        track.missing_url_set.add(url);
      }
      if (hash !== null && !track.present_hash_set.has(hash)) {
        track.missing_hash_set.add(hash);
      }
    }
  }
};

export const isTrackComplete = (track) =>
  track.termination !== null &&
  track.missing_hash_set.size === 0 &&
  track.missing_url_set.size === 0;
