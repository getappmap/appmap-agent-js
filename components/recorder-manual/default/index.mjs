// const PAUSE_STATE = 1;
const PLAY_STATE = 2;
const STOP_STATE = 3;

export default (dependencies) => {
  const {
    util: { assert },
    expect: { expect },
    agent: {
      createAgent,
      executeAgentAsync,
      createTrack,
      startTrack,
      stopTrack,
      interruptAgent,
    },
  } = dependencies;
  class Appmap {
    constructor(configuration) {
      const { mode, recorder } = configuration;
      assert(recorder === "manual", "expected manual recorder");
      expect(mode === "local", "manual recorder only supports local mode");
      this.agent = createAgent(configuration);
      this.running = true;
      this.promise = executeAgentAsync(this.agent);
    }
    start(options) {
      expect(
        this.running,
        "cannot start a new recording because this appmap has been terminated",
      );
      return new Recorder(this.agent, options);
    }
    terminate(termination) {
      expect(this.running, "this appmap has already been terminated");
      this.running = false;
      interruptAgent(this.agent, { errors: [], status: 0, ...termination });
      return this.promise;
    }
  }
  class Recorder {
    constructor(agent, initialization) {
      const track = createTrack(agent);
      startTrack(agent, track, { ...initialization });
      this.agent = agent;
      this.track = track;
      this.state = PLAY_STATE;
    }
    stop(termination) {
      expect(
        this.state !== STOP_STATE,
        "cannot stop recording because it has already been stopped",
      );
      this.state = STOP_STATE;
      stopTrack(this.agent, this.track, termination);
    }
    // play() {
    //   expect(
    //     this.state === PAUSE_STATE,
    //     "cannot play recording because it is not currently on pause",
    //   );
    //   this.state = PLAY_STATE;
    //   controlTrack(this.agent, this.track, "play");
    // }
    // pause() {
    //   expect(
    //     this.state === PLAY_STATE,
    //     "cannot pause recording because it is not currently playing",
    //   );
    //   this.state = PAUSE_STATE;
    //   controlTrack(this.agent, this.track, "pause");
    // }
  }
  return { Appmap };
};
