export default (dependencies) => {
  const {
    util: { getFilename },
  } = dependencies;
  const makeClient = ({ package: { name, version, homepage } }) => ({
    name,
    version,
    url: homepage,
  });

  const makeRecording = ({
    "defined-class": defined_class,
    "method-id": method_id,
  }) => ({
    defined_class,
    method_id,
  });

  const getEngineName = ({ name, version }) =>
    name === null ? null : version === null ? name : `${name}@${version}`;

  const getHistory = ({ history }) => history;

  const getAppName = (app, { package: { name } }) =>
    app === null ? name : app;

  const getMapName = (name, { filename }, main) => {
    if (name !== null) {
      return name;
    }
    if (filename !== null) {
      return filename;
    }
    if (main !== null) {
      return getFilename(main);
    }
    return null;
  };

  const getTestStatus = ({ errors, status }) => {
    const { length } = errors;
    return length === 0 && status === 0 ? "succeeded" : "failed";
  };

  const getException = ({ errors }) => {
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
      name: getMapName(name, output, main),
      app: getAppName(app, repository),
      labels,
      language: {
        ...language,
        engine: getEngineName(engine),
      },
      frameworks,
      client: makeClient(agent),
      recorder,
      recording: makeRecording(recording),
      git: getHistory(repository),
      test_status: getTestStatus(termination),
      exception: getException(termination),
    }),
  };
};
