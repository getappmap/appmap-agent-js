const _undefined = undefined;

const regexp1 =
  /^(\p{ID_Start}\p{ID_Continue}*[#.])?\p{ID_Start}\p{ID_Continue}*$/u;

// Different from regexp1 because it needs to handle anonymous names -- eg: arrow-123
const regexp2 = /^([^#.]+[#.])?([^#.]*)$/u;

export default (dependencies) => {
  const {
    util: { assert },
  } = dependencies;
  return {
    isQualifiedName: (string) => regexp1.test(string),
    stringifyQualifiedName: ({ qualifier, static: _static, name }) => {
      if (qualifier === null) {
        return name;
      }
      return `${qualifier}${_static ? "#" : "."}${name}`;
    },
    parseQualifiedName: (qualified_name) => {
      const parts = regexp2.exec(qualified_name);
      assert(parts !== null, "invalid qualified name");
      const [, qualifier, name] = parts;
      if (qualifier === _undefined) {
        return {
          qualifier: null,
          static: null,
          name,
        };
      }
      const { length } = qualifier;
      return {
        qualifier: qualifier.substring(0, length - 1),
        static: qualifier[length - 1] === "#",
        name,
      };
    },
  };
};
