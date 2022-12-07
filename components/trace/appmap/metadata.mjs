import { InternalAppmapError } from "../../error/index.mjs";
import { assert, mapMaybe, recoverMaybe } from "../../util/index.mjs";
import { getUrlBasename } from "../../url/index.mjs";

const { undefined } = globalThis;

/* c8 ignore start */
const getName = ({ name }) => name;

const makeClient = (agent) => {
  if (agent === null) {
    agent = {
      directory: null,
      package: {
        name: "@appland/appmap-agent-js",
        version: "???",
        homepage: undefined,
      },
    };
  }
  const {
    package: { name, version, homepage },
  } = agent;
  return {
    name,
    version,
    url:
      homepage === null || homepage === undefined
        ? "https://github.com/applandinc/appmap-agent-js"
        : homepage,
  };
};

/* c8 ignore stop */

const makeJustRecording = ({
  "defined-class": defined_class,
  "method-id": method_id,
}) => ({
  defined_class,
  method_id,
});

const makeRecording = (recording) => mapMaybe(recording, makeJustRecording);

const sanitizeHistory = ({ repository, branch, commit, ...rest }) => ({
  repository: recoverMaybe(repository, "APPMAP-MISSING-REPOSITORY-NAME"),
  branch: recoverMaybe(branch, "APPMAP-MISSING-REPOSITORY-BRANCH"),
  commit: recoverMaybe(commit, "APPMAP-MISSING-REPOSITORY-COMMIT"),
  ...rest,
});

const makeGit = ({ history }) => mapMaybe(history, sanitizeHistory);

const makeAppName = (app_name, { package: _package }) =>
  app_name === null ? mapMaybe(_package, getName) : app_name;

const makeMapName = (map_name, file_name, main) => {
  if (map_name !== null) {
    return map_name;
  }
  if (file_name !== null) {
    return file_name;
  }
  if (main !== null) {
    return getUrlBasename(main);
  }
  return null;
};

const makeTestStatus = (termination) => {
  if (termination.type === "test") {
    return termination.passed ? "succeeded" : "failed";
  } else {
    return null;
  }
};

const makeRecorder = (recorder) => {
  assert(
    recorder !== null,
    "recorder should have been resolved earlier",
    InternalAppmapError,
  );
  return { name: recorder };
};

const makeException = (serials) => {
  if (serials.length === 0) {
    return null;
  } else {
    const serial = serials[0];
    if (serial.type === "object" || serial.type === "function") {
      if (serial.specific !== null && serial.specific.type === "error") {
        return {
          class: serial.specific.name,
          message: serial.specific.message,
        };
      } else {
        return {
          class: serial.constructor,
          message: serial.print,
        };
      }
    } else {
      return {
        class: serial.type,
        message: serial.print,
      };
    }
  }
};

/* c8 ignore start */
export const compileMetadata = (
  {
    name: app_name,
    "map-name": map_name,
    repository,
    labels,
    frameworks,
    language,
    engine,
    agent,
    main,
    appmap_file: file_name,
    recorder,
    recording,
  },
  errors,
  termination,
) => ({
  name: makeMapName(map_name, file_name, main) ?? undefined,
  app: makeAppName(app_name, repository) ?? undefined,
  labels: labels ?? undefined,
  language: {
    name: language,
    version: "ES.Next",
    engine: engine ?? undefined,
  },
  frameworks: frameworks ?? undefined,
  client: makeClient(agent),
  recorder: makeRecorder(recorder),
  recording: makeRecording(recording) ?? undefined,
  git: makeGit(repository) ?? undefined,
  test_status: makeTestStatus(termination) ?? undefined,
  exception: makeException(errors) ?? undefined,
});
/* c8 ignore stop */
