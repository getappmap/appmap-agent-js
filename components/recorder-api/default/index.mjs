import {
  InternalAppmapError,
  ExternalAppmapError,
} from "../../error/index.mjs";
import { logError, logErrorWhen } from "../../log/index.mjs";
import { assert } from "../../util/index.mjs";
import { getUuid } from "../../uuid/index.mjs";
import { runScript } from "../../interpretation/index.mjs";
import { extendConfiguration } from "../../configuration/index.mjs";
import { resolveConfigurationManualRecorder } from "../../configuration-accessor/index.mjs";
import { hook, unhook } from "../../hook/index.mjs";
import {
  openAgent,
  closeAgent,
  instrument,
  recordStartTrack,
  recordStopTrack,
  takeLocalAgentTrace,
} from "../../agent/index.mjs";

const { URL, Set, String } = globalThis;

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
    this.configuration = configuration;
    this.agent = openAgent(configuration);
    this.hooking = hook(this.agent, configuration);
    this.tracks = new Set();
    global_running = true;
  }
  instrumentScript(content, url) {
    expectRunning(this.hooking);
    return instrument(this.agent, makeFile("script", content, url), null);
  }
  instrumentModule(content, url) {
    expectRunning(this.hooking);
    return instrument(this.agent, makeFile("module", content, url), null);
  }
  recordScript(content, url) {
    expectRunning(this.hooking);
    return runScript(this.instrumentScript(content, url));
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
    recordStartTrack(
      this.agent,
      track,
      extendConfiguration(this.configuration, conf, base),
    );
    return track;
  }
  stopRecording(track, termination = { type: "manual" }) {
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
    recordStopTrack(this.agent, track, termination);
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
