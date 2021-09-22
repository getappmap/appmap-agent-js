const _Set = Set;

export default (dependencies) => {
  const {
    uuid: { getUUID },
    util: { assert },
    expect: { expect },
    agent: {
      openAgent,
      promiseAgentTermination,
      closeAgent,
      runManually,
      pilotAgent,
      startTrack,
      stopTrack,
    },
  } = dependencies;
  const start = ({ running, tracks }, track) => {
    expect(
      running,
      "cannot start track %j because this appmap has been terminated",
      track,
    );
    expect(
      !tracks.has(track),
      "cannot start track %j because it already exists",
      track,
    );
    tracks.add(track);
  };
  const stop = ({ running, tracks }, track) => {
    expect(
      running,
      "cannot start a new recording because this appmap has been terminated",
    );
    expect(
      tracks.has(track),
      "cannot stop track %j because it is missing",
      track,
    );
    tracks.delete(track);
  };
  class Appmap {
    static getUniversalUniqueIdentifier() {
      return getUUID();
    }
    constructor(configuration) {
      const { mode, recorder } = configuration;
      assert(recorder === "manual", "expected manual recorder");
      expect(mode === "local", "manual recorder only supports local mode");
      this.agent = openAgent(configuration);
      this.tracks = new _Set();
      this.running = true;
      this.promise = promiseAgentTermination(this.agent);
    }
    runScript(path, code) {
      return runManually(this.agent, path, code);
    }
    /* c8 ignore start */
    startTrack(track, initialization = null) {
      start(this, track);
      const { code } = pilotAgent(
        this.agent,
        "POST",
        `/${track}`,
        initialization,
      );
      assert(code === 200, "unexpected http error status");
    }
    stopTrack(track, termination = null) {
      stop(this, track);
      const { code, body } = pilotAgent(
        this.agent,
        "DELETE",
        `/${track}`,
        termination,
      );
      assert(code === 200, "unexpect http error status");
      return body;
    }
    /* c8 ignore stop */
    startStoredTrack(track, initialization) {
      start(this, track);
      startTrack(this.agent, track, {
        path: null,
        data: {},
        ...initialization,
      });
    }
    stopStoredTrack(track, termination) {
      stop(this, track);
      stopTrack(this.agent, track, { errors: [], status: 0, ...termination });
    }
    terminate(termination) {
      expect(this.running, "this appmap has already been terminated");
      this.running = false;
      closeAgent(this.agent, { errors: [], status: 0, ...termination });
      return this.promise;
    }
  }
  return { Appmap };
};
