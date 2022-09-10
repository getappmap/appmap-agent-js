
const {
  navigator: {userAgent: description},
} = globalThis;

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
      return `${parts[1]}@${parts[2]}`;
    },
  };
};
