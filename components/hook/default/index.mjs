const { ownKeys } = Reflect;
const { fromEntries } = Object;

export default (dependencies) => {
  const { "hook-module": transformSourceDefault } = dependencies;
  const names = ownKeys(dependencies);
  return {
    transformSourceDefault,
    hook: (agent, configuration) =>
      fromEntries(
        names.map((name) => [
          name,
          dependencies[name].hook(agent, configuration),
        ]),
      ),
    unhook: (hooking) => {
      for (const name of names) {
        dependencies[name].unhook(hooking[name]);
      }
    },
  };
};
