const {
  Error,
  undefined,
  Reflect: { getOwnPropertyDescriptor, ownKeys },
  Object: {
    hasOwn = (object, key) =>
      getOwnPropertyDescriptor(object, key) !== undefined,
  },
} = globalThis;

export const selectComponentInstance = (component, env, params) => {
  const environment = params.get("env");
  if (params.has(component)) {
    const instance = params.get(component);
    if (hasOwn(env, instance)) {
      if (env[instance].includes(environment)) {
        return instance;
      } else {
        throw new Error(
          `Illegal environment ${environment} for component ${component} on instance ${instance}`,
        );
      }
    } else {
      throw new Error(
        `Illegal instance ${instance} for component ${component}`,
      );
    }
  } else {
    const instances = [];
    for (const instance of ownKeys(env)) {
      if (env[instance].includes(environment)) {
        instances.push(instance);
      }
    }
    if (instances.length === 0) {
      throw new Error(
        `No instance for component ${component} with environment ${environment}`,
      );
    } else if (instances.length === 1) {
      return instances[0];
    } else {
      throw new Error(
        `Multiple instances for component ${component} with environment ${environment} requires an explicit search param`,
      );
    }
  }
};
