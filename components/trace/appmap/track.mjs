const _Map = Map;
const _Set = Set;

const { from: toArray } = Array;

export default (dependencies) => {
  const {
    util: { assert },
  } = dependencies;
  return {
    collectTracks: (marks) => {
      const tracks = new _Map();
      const states = new _Map();
      for (let mark of marks) {
        if (mark.type === "track") {
          const { data: command } = mark;
          if (command.type === "start") {
            assert(!tracks.has(command.index), "duplicate track");
            tracks.set(command.index, {
              configuration: command.configuration,
              routes: new _Set(),
              slice: new _Set(),
            });
            states.set(command.index, true);
          } else {
            assert(states.has(command.index), "missing track");
            if (command.type === "stop") {
              states.delete(command.index);
            } else {
              const enabled = states.get(command.index);
              assert(
                enabled === (command.type === "pause"),
                "invalid command for current track state",
              );
              states.set(command.index, !enabled);
            }
          }
        } else if (mark.type === "event") {
          const { data: event } = mark;
          if (event.type === "begin") {
            const { data: payload } = event;
            if (payload.type === "apply") {
              for (const [index, enabled] of states) {
                if (enabled) {
                  tracks.get(index).routes.add(payload.route);
                }
              }
            }
            for (const [index, enabled] of states) {
              if (enabled) {
                tracks.get(index).slice.add(event.index);
              }
            }
          }
        }
      }
      return toArray(tracks.values());
    },
  };
};
