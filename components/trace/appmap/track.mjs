const _Map = Map;
const { from } = Array;

export default (dependencies) => {
  const {
    util: { assert },
  } = dependencies;
  const cleanupTrack = ({ configuration, marks }) => ({
    configuration,
    marks,
  });
  return {
    splitByTrack: (marks) => {
      const tracks = new _Map();
      for (let mark of marks) {
        const { type, data } = mark;
        if (type === "track") {
          const { type, index } = data;
          if (type === "start") {
            assert(!tracks.has(index), "duplicate track index");
            let { configuration } = data;
            tracks.set(index, {
              configuration,
              enabled: true,
              marks: [],
            });
          } else {
            assert(tracks.has(index), "missing track index");
            const track = tracks.get(index);
            track.enabled = type === "play";
          }
        } else {
          for (const { enabled, marks } of tracks.values()) {
            if (enabled) {
              marks.push(mark);
            }
          }
        }
      }
      return from(tracks.values()).map(cleanupTrack);
    },
  };
};
