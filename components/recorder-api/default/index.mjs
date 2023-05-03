import {
  InternalAppmapError,
  ExternalAppmapError,
} from "../../error/index.mjs";
import { logError, logErrorWhen } from "../../log/index.mjs";
import { assert } from "../../util/index.mjs";
import { getUuid } from "../../uuid/index.mjs";
import { toDirectoryUrl } from "../../url/index.mjs";
import { runScript } from "../../interpretation/index.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import { resolveConfigurationManualRecorder } from "../../configuration-accessor/index.mjs";
import { hook, unhook } from "../../hook/index.mjs";
import {
  createFrontend,
  flushMessageArray,
  instrument,
  recordStartTrack,
  recordStopTrack,
} from "../../frontend/index.mjs";
import {
  createBackend,
  sendBackend,
  compileBackendTrack,
} from "../../backend/index.mjs";

const { URL, Set, String } = globalThis;

let global_running = false;

const validateUrl = (url = "file:///w:/missing-file-url.mjs") => {
  try {
    url = String(url);
    new URL(url);
    return url;
  } catch (error) {
    logError(
      "The second argument of appmap.recordScript is not a valid url, got: %j >> %O",
      url,
      error,
    );
    throw new ExternalAppmapError("Invalid url argument");
  }
};

/* c8 ignore start */
const readFile = (_url) => {
  throw new ExternalAppmapError("Recorder API does not support source map");
};
/* c8 ignore stop */

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

const flush = (frontend, backend) => {
  for (const message of flushMessageArray(frontend)) {
    sendBackend(backend, message);
  }
};

export class Appmap {
  constructor(home, conf, base) {
    assert(
      !logErrorWhen(
        global_running,
        "Two appmap instances cannot be active concurrently.",
      ),
      "Concurrent appmap instances",
      ExternalAppmapError,
    );
    const configuration = resolveConfigurationManualRecorder(
      extendConfiguration(
        {
          ...createConfiguration(toDirectoryUrl(home)),
          session: "singleton",
        },
        conf,
        toDirectoryUrl(base),
      ),
    );
    this.configuration = configuration;
    this.frontend = createFrontend(configuration);
    this.backend = createBackend(configuration);
    this.hooking = hook(this.frontend, configuration);
    this.tracks = new Set();
    global_running = true;
  }
  instrumentScript(content, url) {
    expectRunning(this.hooking);
    url = validateUrl(url);
    return instrument(this.frontend, url, String(content), readFile);
  }
  instrumentModule(content, url) {
    expectRunning(this.hooking);
    url = validateUrl(url);
    return instrument(this.frontend, url, String(content), readFile);
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
      this.frontend,
      track,
      extendConfiguration(this.configuration, conf, base),
    );
    flush(this.frontend, this.backend);
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
    recordStopTrack(this.frontend, track, termination);
    flush(this.frontend, this.backend);
    return compileBackendTrack(this.backend, track).content;
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
  }
}
