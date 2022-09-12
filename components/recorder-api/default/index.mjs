const { Set, String, URL } = globalThis;

export default (dependencies) => {
  const {
    util: { assert },
    expect: { expect, expectSuccess },
    uuid: { getUUID },
    interpretation: { runScript },
    "configuration-accessor": { resolveConfigurationManualRecorder },
    hook: { hook, unhook },
    agent: {
      openAgent,
      closeAgent,
      instrument,
      recordError,
      recordStartTrack,
      recordStopTrack,
      takeLocalAgentTrace,
    },
  } = dependencies;
  // const {
  //   recordBeginBundle,
  //   recordApply,
  //   recordServerRequest,
  //   recordBeforeJump,
  //   recordQuery,
  //   recordClientRequest,
  // } = Record(dependencies);
  let global_running = false;
  const makeFile = (type, content, url = "file:///") => {
    content = String(content);
    url = String(url);
    expectSuccess(
      () => new URL(url),
      "the second argument of appmap.recordScript should be a valid url, got: %j >> %O",
      url,
    );
    return { type, url, content };
  };
  const expectRunning = (hooking) => {
    expect(hooking !== null, "This appmap instance has been terminated.");
  };
  class Appmap {
    constructor(configuration) {
      expect(
        !global_running,
        "Two appmap instances cannot be active concurrently.",
      );
      configuration = resolveConfigurationManualRecorder(configuration);
      this.agent = openAgent(configuration);
      this.hooking = hook(this.agent, configuration);
      this.tracks = new Set();
      global_running = true;
    }
    instrumentScript(content, url) {
      expectRunning(this.hooking);
      return instrument(this.agent, makeFile("script", content, url));
    }
    instrumentModule(content, url) {
      expectRunning(this.hooking);
      return instrument(this.agent, makeFile("module", content, url));
    }
    recordScript(content, url) {
      expectRunning(this.hooking);
      return runScript(this.instrumentScript(content, url));
    }
    recordError(name = "", message = "", stack = "") {
      recordError(this.agent, name, message, stack);
    }
    startRecording(track, conf = {}, base = null) {
      expectRunning(this.hooking);
      if (track === null) {
        track = getUUID();
      }
      expect(
        !this.tracks.has(track),
        "Cannot start track %j because it already exists.",
        track,
      );
      this.tracks.add(track);
      recordStartTrack(this.agent, track, conf, base);
      return track;
    }
    stopRecording(track, status = 0) {
      expectRunning(this.hooking);
      expect(
        this.tracks.has(track),
        "Cannot stop track %j because it is missing.",
        track,
      );
      this.tracks.delete(track);
      recordStopTrack(this.agent, track, status);
      return takeLocalAgentTrace(this.agent, track);
    }
    terminate() {
      expectRunning(this.hooking);
      assert(global_running, "globally unregistered appmap instance");
      global_running = false;
      unhook(this.hooking);
      this.hooking = null;
      closeAgent(this.agent);
    }
    /* c8 ignore start */
    // getEmptyValue() {
    //   expectRunning(this.hooking);
    //   return getSerializationEmptyValue(this.agent);
    // }
    // recordBeginBundle(data) {
    //   expectRunning(this.hooking);
    //   return recordBeginBundle(this.agent, data);
    // }
    // recordApply(data) {
    //   expectRunning(this.hooking);
    //   return recordApply(this.agent, data);
    // }
    // recordServerRequest(data) {
    //   expectRunning(this.hooking);
    //   return recordServerRequest(this.agent, data);
    // }
    // recordBeforeJump(data) {
    //   expectRunning(this.hooking);
    //   return recordBeforeJump(this.agent, data);
    // }
    // recordQuery(data) {
    //   expectRunning(this.hooking);
    //   return recordQuery(this.agent, data);
    // }
    // recordClientRequest(data) {
    //   expectRunning(this.hooking);
    //   return recordClientRequest(this.agent, data);
    // }
    /* c8 ignore stop */
  }
  return { Appmap };
};
