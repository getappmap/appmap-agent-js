const { fromEntries } = Object;

export default (dependencies) => {
  const { "hook-module": transformSourceDefault } = dependencies;
  const names = [
    "hook-apply",
    "hook-group",
    "hook-module",
    "hook-query",
    "hook-http-client",
    "hook-http-server",
  ];
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
