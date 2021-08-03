
import Child from "./child.mjs";
import minimist from "minimist";

export default (dependencies) => {
  return {
    main: async ({cwd, argv, env}) => {
      const { _:command, configuration:path1, repository:path2  ... configuration_data} = {
        configuration: `${cwd()}/appmap.yml`,
        repository: cwd(),
        ... minimist(argv.slice(2)),
      };
      assert(command.length > 0, "expected at least one positional argument");
      let configuration = createConfiguration(path2);
      try {
        configuration = extendConfiguration(parseYAML(await readFile(path1, "utf8")), path1);
      } catch (error) {
        assert(coalesce(error, "code", null) === "ENOENT", "failed to load configuration >> %e", error);
        logWarning("missing configuration file: %s", path1);
      }
      configuration = extendConfiguration(configuration_data, cwd());
      const [{signal, status}] = await batchAsync(
        [{
          path: cwd(),
          data: {
            type: "spawn",
            recorder,
            exec: command[0],
            argv: command.slice(1),
          },
        }],
        env,
        configuration
      );
      return signal === null ? status : 1;
    },
  };
};
