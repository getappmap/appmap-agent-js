const _Set = Set;

export default (dependencies) => {
  const {
    util: { assert },
    expect: { expect },
    uuid: { getUUID },
    "configuration-accessor": { sanitizeConfigurationManual },
    "source-outer": { extractSourceMap },
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
      this.agent = openAgent(sanitizeConfigurationManual(configuration));
      this.tracks = new _Set();
      this.running = true;
      global_running = true;
    }
    recordScript(url, content) {
      if (!/^[a-z]:\/\//u.test(url)) {
        expect(
          url[0] === "/",
          "expected an absolute unix path but got: %j",
          url,
        );
        url = `file://${url}`;
      }
      const file = { url, content };
      return recordAgentScript(this.agent, file, extractSourceMap(file));
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
