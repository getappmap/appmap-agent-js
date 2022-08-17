const { fromEntries } = Object;

export default (dependencies) => {
  const names = [
    "hook-apply",
    "hook-group",
    "hook-esm",
    "hook-cjs",
    "hook-eval",
    "hook-query",
    "hook-http-client",
    "hook-http-server",
  ];
  return {
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
