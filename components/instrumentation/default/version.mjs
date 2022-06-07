export default (dependencies) => {
  const {
    log: { logGuardWarning, logWarning },
  } = dependencies;
  const names = ["ecmascript", "javascript", "js"];
  const versions = [
    "3",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
    "13",
    "2015",
    "2016",
    "2017",
    "2018",
    "2019",
    "2020",
    "2021",
    "2022",
  ];
  return {
    getEcmaVersion: ({ name, version }) => {
      if (names.includes(name)) {
        if (versions.includes(version)) {
          return parseInt(version);
        } else {
          logGuardWarning(
            version !== null && version !== "latest",
            "Expected language version to be one of %j, but got: %j.",
            versions,
            version,
          );
          return "latest";
        }
      } else {
        logWarning(
          "Expected language name to be one of %j, but got: %j.",
          names,
          name,
        );
        return "latest";
      }
    },
  };
};
