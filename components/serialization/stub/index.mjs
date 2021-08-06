const _Symbol = Symbol;

export default (dependencies) => {
  const {
    assert: { print },
    util: { identity, constant },
  } = dependencies;
  return {
    createSerialization: constant(_Symbol("empty")),
    getSerializationEmptyValue: identity,
    serialize: (empty, value) => (value === empty ? null : print(value)),
  };
};
