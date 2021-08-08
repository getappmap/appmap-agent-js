const _Map = Map;
const { from } = Array;

export default (dependencies) => {
  const {
    util: { assert },
  } = dependencies;
  const cleanupTrack = ({ options, messages }) => ({
    options,
    messages,
  });
  return {
    splitByTrack: (messages) => {
      const tracks = new _Map();
      for (let message of messages) {
        const { type, data } = message;
        if (type === "track") {
          const { type, index } = data;
          if (type === "start") {
            assert(!tracks.has(index), "duplicate track index");
            const { options } = data;
            tracks.set(index, {
              options,
              enabled: true,
              messages: [],
            });
          } else {
            assert(tracks.has(index), "missing track index");
            const track = tracks.get(index);
            track.enabled = type === "play";
          }
        } else {
          for (const { enabled, messages } of tracks.values()) {
            if (enabled) {
              messages.push(message);
            }
          }
        }
      }
      return from(tracks.values()).map(cleanupTrack);
    },
  };
};
