const _Map = Map;
const { from } = Array;

export default (dependencies) => {
  const {
    assert: { assert },
  } = dependencies;
  const cleanupTrack = ({ options, trace }) => ({
    options,
    trace,
  });
  return {
    splitByTrack: (trace) => {
      const tracks = new _Map();
      for (let element of trace) {
        const { type, data } = element;
        if (type === "track") {
          const { type, index } = data;
          if (type === "start") {
            assert(!tracks.has(index), "duplicate track index: %j", index);
            const { options } = data;
            tracks.set(index, {
              options,
              enabled: true,
              trace: [],
            });
          } else {
            assert(tracks.has(index), "missing track index: %j", index);
            const track = tracks.get(index);
            track.enabled = type === "play";
          }
        } else {
          for (const { enabled, trace } of tracks.values()) {
            if (enabled) {
              trace.push(element);
            }
          }
        }
      }
      return from(tracks.values()).map(cleanupTrack);
    },
  };
};
