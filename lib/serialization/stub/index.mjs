export default (dependencies) => {
  const {
    assert: { print },
  } = dependencies;
  return {
    createSerialization: (options) => Symbol("empty"),
    getSerializationEmptyValue: (empty) => empty,
    serialize: (empty, value) => (value === empty ? null : print(value)),
  };
};
