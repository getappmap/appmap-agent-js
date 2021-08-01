export default (dependencies) => {
  const makeClient = ({ name, version, homepage }) => ({
    name,
    version,
    url: homepage,
  });

  const makeRecording = ({
    "define-class": defined_class,
    "method-id": method_id,
  }) => ({
    defined_class,
    method_id,
  });

  const getFilename = (path) => {
    const segments = path.split("/");
    return segments[segments.length - 1];
  };

  const getEngineName = ({ name, version }) =>
    name === null ? null : version === null ? name : `${name}@${version}`;

  const getHistory = ({ history }) => history;

  const getName = ({ name }) => name;

  const getAppName = ({ name: name1 }, { package: { name: name2 } }) =>
    name1 === null ? name2 : name1;

  const getMapName = ({ name }, { filename }, { path }) => {
    if (name !== null) {
      return name;
    }
    if (filename !== null) {
      return filename;
    }
    if (path !== null) {
      return getFilename(path);
    }
    return null;
  };

  return {
    compileMetadata: ({
      app,
      map,
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
    }) => ({
      name: getMapName(map, output, main),
      app: getAppName(app, repository),
      labels,
      language: {
        ...language,
        engine: getEngineName(engine),
      },
      frameworks,
      client: makeClient(agent),
      recorder: getName(recorder),
      recording: makeRecording(recording),
      git: getHistory(repository),
      test_status: null,
      exception: null,
    }),
  };
};
