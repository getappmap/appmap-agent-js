const _Symbol = Symbol;

export default (dependencies) => {
  const {
    assert: { print },
    util: { identity, noop, constant },
  } = dependencies;
  return {
    createSerialization: constant(_Symbol("empty")),
    configureSerialization: noop,
    getSerializationEmptyValue: identity,
    serialize: (empty, value) => (value === empty ? null : print(value)),
  };
};
