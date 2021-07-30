const _Map = Map;
const { from } = Array;

export default (dependencies) => {
  const {
    assert: { assert },
  } = dependencies;
  return {
    splitTrack: (trace) => {
      const tracks = new _Map();
      for (let { type, data } of trace) {
        if (type === "track") {
          const { type, index } = data;
          if (type === "start") {
            assert(!tracks.has(index), "duplicate track index: %j", index);
            const { options } = data;
            tracks.set(index, {
              options,
              enabled: true,
              events: [],
            });
          } else {
            assert(tracks.has(index), "missing track index: %j", index);
            const track = tracks.get(index);
            track.enabled = type === "play";
          }
        } else if (type === "event") {
          for (const { enabled, events } of tracks.values()) {
            if (enabled) {
              events.push(data);
            }
          }
        }
      }
      return from(tracks.values()).map(({ options, events }) => ({
        options,
        events,
      }));
    },
  };
};
