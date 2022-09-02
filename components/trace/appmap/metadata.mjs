export default (dependencies) => {
  const {
    util: { assert, mapMaybe, recoverMaybe },
    url: { getLastURLSegment },
  } = dependencies;

  /* c8 ignore start */
  const getName = ({ name }) => name;

  const makeClient = (agent) => {
    if (agent === null) {
      agent = {
        directory: null,
        package: {
          name: "@appland/appmap-agent-js",
          version: "???",
          homepage: null,
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
        homepage === null
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

  const makeHistory = ({ history }) => history;

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
      return getLastURLSegment(main).split(".")[0];
    }
    return null;
  };

  const makeTestStatus = (errors, status) => {
    const { length } = errors;
    return length === 0 && status === 0 ? "succeeded" : "failed";
  };

  const makeRecorder = (recorder) => {
    assert(recorder !== null, "recorder should have been resolved earlier");
    return { name: recorder };
  };

  const makeException = (errors) => {
    const { length } = errors;
    if (length === 0) {
      return null;
    } else {
      const [{ name, message }] = errors;
      return {
        class: recoverMaybe(name, "APPMAP-MISSING-ERROR-NAME"),
        message,
      };
    }
  };

  return {
    compileMetadata: (
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
      status,
    ) => ({
      name: makeMapName(map_name, file_name, main),
      app: makeAppName(app_name, repository),
      labels,
      language: {
        name: language,
        version: "ES.Next",
        engine,
      },
      frameworks,
      client: makeClient(agent),
      recorder: makeRecorder(recorder),
      recording: makeRecording(recording),
      git: makeHistory(repository),
      test_status: makeTestStatus(errors, status),
      exception: makeException(errors),
    }),
  };
};
