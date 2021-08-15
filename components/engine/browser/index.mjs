const { userAgent: description } = navigator;

const regexp = /^([^ \n\t/]+)\/([^ \n\t/]+) /;

export default (dependencies) => {
  const {
    expect: { expect },
  } = dependencies;
  return {
    getEngine: () => {
      const parts = regexp.exec(description);
      expect(
        parts !== null,
        "could not parse navigator.userAgent: %j",
        description,
      );
      return {
        name: parts[1],
        version: parts[2],
      };
    },
  };
};
