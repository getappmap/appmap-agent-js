const _Set = Set;

export default (dependencies) => {
  const {
    util: { assert },
    expect: { expect },
    uuid: { getUUID },
    configuration: { extendConfiguration },
    log: { logGuardWarning },
    agent: {
      openAgent,
      closeAgent,
      recordAgentScript,
      startTrack,
      stopTrack,
      takeLocalAgentTrace,
    },
  } = dependencies;
  let global_running = false;
  class Appmap {
    constructor(configuration) {
      expect(
        !global_running,
        "Two appmap instances cannot be active concurrently.",
      );
      {
        const {
          recorder,
          hooks: { esm },
        } = configuration;
        logGuardWarning(
          recorder !== "manual",
          "Manual recorder expected configuration field 'recorder' to be \"manual\" and got %j.",
          recorder,
        );
        logGuardWarning(
          esm,
          "Manual recorder does not support native module recording and configuration field 'hooks.esm' is enabled.",
        );
      }
      this.agent = openAgent(
        extendConfiguration(configuration, {
          recorder: "manual",
          hooks: {
            esm: false,
          },
        }),
      );
      this.tracks = new _Set();
      this.running = true;
      global_running = true;
    }
    recordScript(path, code) {
      expect(path[0] === "/", "expected an absolute path but got: %j", path);
      return recordAgentScript(this.agent, path, code);
    }
    startTrack(track, initialization) {
      if (track === null) {
        track = getUUID();
      }
      expect(
        this.running,
        "Cannot start track %j because this appmap has been terminated.",
        track,
      );
      expect(
        !this.tracks.has(track),
        "Cannot start track %j because it already exists.",
        track,
      );
      this.tracks.add(track);
      startTrack(this.agent, track, {
        path: null,
        data: {},
        ...initialization,
      });
      return track;
    }
    stopTrack(track, termination) {
      expect(
        this.running,
        "Cannot stop track %j because this appmap has been terminated.",
        track,
      );
      expect(
        this.tracks.has(track),
        "Cannot stop track %j because it is missing.",
        track,
      );
      this.tracks.delete(track);
      stopTrack(this.agent, track, { errors: [], status: 0, ...termination });
      return takeLocalAgentTrace(this.agent, track);
    }
    terminate() {
      expect(this.running, "This appmap has already been terminated.");
      assert(global_running, "globally unregistered appmap instance");
      global_running = false;
      this.running = false;
      closeAgent(this.agent);
    }
  }
  return { Appmap };
};
