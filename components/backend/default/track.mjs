import { compileTrace } from "../../trace/index.mjs";

export const startTrack = () => ({
  running: true,
  messages: [],
});

export const stopTrack = (track) => {
  track.running = false;
};

export const compileTrack = (track) => compileTrace(track.messages);

export const sendTrack = (track, message) => {
  const { type } = message;
  if (type === "amend" || type === "source" || track.running) {
    track.messages.push(message);
  }
};
