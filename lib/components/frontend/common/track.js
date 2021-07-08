
export const start = (controlTrack, id, options) => {
  controlTrack(id, "start", options);
  return {
    play: () => controlTrack(id, "play", null),
    pause: () => controlTrack(id, "pause", null),
    stop: () => controlTrack(id, "stop", null)
  };
};
