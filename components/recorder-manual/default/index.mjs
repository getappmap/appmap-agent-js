const _Set = Set;
const _Error = Error;

export default (dependencies) => {
  const {
    expect: { expect },
    configuration: { extendConfiguration },
    log: { logGuardWarning },
    agent: {
      openAgent,
      promiseAgentTermination,
      closeAgent,
      recordAgentScript,
      trackAgentAsync,
      startTrack,
      stopTrack,
    },
  } = dependencies;
  class Appmap {
    constructor(configuration) {
      {
        const {
          enabled,
          recorder,
          hooks: { esm },
        } = configuration;
        logGuardWarning(
          recorder !== "manual",
          "Manual recorder expected configuration field 'recorder' to be \"manual\" and got %j.",
          recorder,
        );
        logGuardWarning(
          enabled !== true,
          "Manual recorder is always enabled and configuration field 'enabled' is %j.",
          enabled,
        );
        logGuardWarning(
          esm,
          "Manual recorder does not support native module recording and configuration field 'hooks.esm' is enabled.",
        );
      }
      this.agent = openAgent(
        extendConfiguration(configuration, {
          enabled: true,
          recorder: "manual",
          hooks: {
            esm: false,
          },
        }),
      );
      this.tracks = new _Set();
      this.running = true;
      this.promise = promiseAgentTermination(this.agent);
    }
    recordScript(path, code) {
      expect(path[0] === "/", "expected an absolute path but got: %j", path);
      return recordAgentScript(this.agent, path, code);
    }
    startTrack(track, initialization) {
      expect(
        this.running,
        "cannot start track %j because this appmap has been terminated",
        track,
      );
      expect(
        !this.tracks.has(track),
        "cannot start track %j because it already exists",
        track,
      );
      this.tracks.add(track);
      startTrack(this.agent, track, {
        path: null,
        data: {},
        ...initialization,
      });
    }
    stopTrack(track, termination) {
      expect(
        this.running,
        "cannot stop track %j because this appmap has been terminated",
        track,
      );
      expect(
        this.tracks.has(track),
        "cannot stop track %j because it is missing",
        track,
      );
      this.tracks.delete(track);
      stopTrack(this.agent, track, { errors: [], status: 0, ...termination });
    }
    async claimTrackAsync(track) {
      expect(
        this.running,
        "cannot claim track %j because this appmap has been terminated",
        track,
      );
      expect(
        !this.tracks.has(track),
        "cannot claim track %j because it is still running",
        track,
      );
      const { code, message, body } = await trackAgentAsync(
        this.agent,
        "DELETE",
        `/${track}`,
        null,
      );
      /* c8 ignore start */
      if (code !== 200) {
        throw new _Error(message);
      }
      /* c8 ignore stop */
      return body;
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
