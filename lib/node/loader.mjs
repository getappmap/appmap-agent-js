const {
  Error,
  undefined,
  parseInt,
  Reflect: { getOwnPropertyDescriptor },
  Object: {
    hasOwn = (object, key) =>
      getOwnPropertyDescriptor(object, key) !== undefined,
  },
} = globalThis;

const parseMajorVersion = (version) => {
  const parts = /^v([0-9]+)\./u.exec(version);
  if (parts === null) {
    throw new Error("could not parse node version");
  } else {
    return parseInt(parts[1]);
  }
};

export default (node_version, esm_hook_variable) => {
  const major_node_version = parseMajorVersion(node_version);
  return {
    transformSource:
      major_node_version >= 16
        ? undefined
        : (content, context, next) => {
            if (hasOwn(globalThis, esm_hook_variable)) {
              return globalThis[esm_hook_variable].transformSource(
                content,
                context,
                next,
              );
            } else {
              return next(content, context, next);
            }
          },
    load:
      major_node_version < 16
        ? undefined
        : (url, context, next) => {
            if (hasOwn(globalThis, esm_hook_variable)) {
              return globalThis[esm_hook_variable].load(url, context, next);
            } else {
              return next(url, context, next);
            }
          },
  };
};
