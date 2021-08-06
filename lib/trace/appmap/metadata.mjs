const _String = String;

export default (dependencies) => {
  const {
    util: { getFilename, mapMaybe },
  } = dependencies;

  /* c8 ignore start */
  const getName = ({ name }) => name;
  /* c8 ignore stop */

  const makeClient = ({ package: { name, version, homepage } }) => ({
    name,
    version,
    url: homepage,
  });

  const makeJustRecording = ({
    "defined-class": defined_class,
    "method-id": method_id,
  }) => ({
    defined_class,
    method_id,
  });

  const makeRecording = (recording) => mapMaybe(recording, makeJustRecording);

  const makeJustEngine = ({ name, version }) =>
    version === null ? name : `${name}@${version}`;

  const makeEngine = (engine) => mapMaybe(engine, makeJustEngine);

  const makeHistory = ({ history }) => history;

  const makeApp = (app, { package: _package }) =>
    app === null ? mapMaybe(_package, getName) : app;

  const makeName = (name, { filename }, main) => {
    if (name !== null) {
      return name;
    }
    if (filename !== null) {
      return filename;
    }
    if (main !== null) {
      return getFilename(main).split(".")[0];
    }
    return null;
  };

  const makeTestStatus = ({ errors, status }) => {
    const { length } = errors;
    return length === 0 && status === 0 ? "succeeded" : "failed";
  };

  const makeLanguage = ({ name, version }) => ({
    name,
    version: _String(version),
  });

  const makeException = ({ errors }) => {
    const { length } = errors;
    if (length === 0) {
      return null;
    }
    const [{ name, message }] = errors;
    return {
      class: name,
      message,
    };
  };

  return {
    compileMetadata: (
      {
        app,
        name,
        repository,
        labels,
        frameworks,
        language,
        engine,
        agent,
        main,
        output,
        recorder,
        recording,
      },
      termination,
    ) => ({
      name: makeName(name, output, main),
      app: makeApp(app, repository),
      labels,
      language: {
        ...makeLanguage(language),
        engine: makeEngine(engine),
      },
      frameworks,
      client: makeClient(agent),
      recorder: { name: recorder },
      recording: makeRecording(recording),
      git: makeHistory(repository),
      test_status: makeTestStatus(termination),
      exception: makeException(termination),
    }),
  };
};
