const { Set, String, URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

const { InternalAppmapError, ExternalAppmapError } = await import(
  `../../error/index.mjs${__search}`
);
const { logError, logErrorWhen } = await import(
  `../../log/index.mjs${__search}`
);
const { assert } = await import(`../../util/index.mjs${__search}`);
const { getUuid } = await import(`../../uuid/index.mjs${__search}`);
const { runScript } = await import(`../../interpretation/index.mjs${__search}`);
const { resolveConfigurationManualRecorder } = await import(
  `../../configuration-accessor/index.mjs${__search}`
);
const { hook, unhook } = await import(`../../hook/index.mjs${__search}`);
const {
  openAgent,
  closeAgent,
  instrument,
  recordError,
  recordStartTrack,
  recordStopTrack,
  takeLocalAgentTrace,
} = await import(`../../agent/index.mjs${__search}`);

let global_running = false;

const makeFile = (type, content, url = "file:///w:/missing-file-url.mjs") => {
  content = String(content);
  url = String(url);
  try {
    new URL(url);
  } catch (error) {
    logError(
      "The second argument of appmap.recordScript is not a valid url, got: %j >> %O",
      url,
      error,
    );
    throw new ExternalAppmapError("Invalid url argument");
  }
  return { type, url, content };
};

const expectRunning = (hooking) => {
  assert(
    !logErrorWhen(
      hooking === null,
      "This appmap instance has been terminated.",
    ),
    "Terminated appmap instance",
    ExternalAppmapError,
  );
};

export class Appmap {
  constructor(configuration) {
    assert(
      !logErrorWhen(
        global_running,
        "Two appmap instances cannot be active concurrently.",
      ),
      "Concurrent appmap instances",
      ExternalAppmapError,
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
      track = getUuid();
    }
    assert(
      !logErrorWhen(
        this.tracks.has(track),
        "Cannot start track %j because it already exists.",
        track,
      ),
      "Duplicate track name",
      ExternalAppmapError,
    );
    this.tracks.add(track);
    recordStartTrack(this.agent, track, conf, base);
    return track;
  }
  stopRecording(track, status = 0) {
    expectRunning(this.hooking);
    assert(
      !logErrorWhen(
        !this.tracks.has(track),
        "Cannot stop track %j because it is missing.",
        track,
      ),
      "Missing track name",
      ExternalAppmapError,
    );
    this.tracks.delete(track);
    recordStopTrack(this.agent, track, status);
    return takeLocalAgentTrace(this.agent, track);
  }
  terminate() {
    expectRunning(this.hooking);
    assert(
      global_running,
      "globally unregistered appmap instance",
      InternalAppmapError,
    );
    global_running = false;
    unhook(this.hooking);
    this.hooking = null;
    closeAgent(this.agent);
  }
}
