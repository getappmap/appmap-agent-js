
import Child from "./child.mjs";

export default (dependencies) => {
  const {
    server:{openServerAsync, closeServer, promiseServerTermination},
    configuration:{createConfiguration, extendConfiguration},
  } = dependencies;
  const runOneAsync = ({exec, argv, options, description}) => await new _Promise((resolve, reject) => {
    try {
      logInfo("%s ...", index, length, description);
      const child = spawn(exec, argv, options);
      child.on('exit', (status, signal) => {
        if (signal !== null) {
          logInfo("> Killed with: %s", signal);
        } else {
          logInfo("> Exited with: $j", status);
        }
        resolve({description, signal, status});
      });
      child.on("error", asssertDeadcodeAsync(reject, "child %j error >> %e"), description);
    } catch (error) {
      reject(error);
    }
  });
  const runAllAsync = (compiled_children) => {
    const {length} = compiled_children;
    if (length === 0) {
      logWarning("No children found to spawn, instructions to spawn children should be placed in the configuration file in the children field or alternatively provide a command to spawn as positional arguments");
    } else if (length === 1) {
      await runOneAsync(compiled_children[0]);
    } else {
      logInfo("Spawning %j children sequentially", length);
      const summary = [];
      for (let index = 0; index <= length; index += 1) {
        logInfo("%j/%j", index, length);
        summary.push(await runOneAsync(compiled_children[index]);
      }
      logInfo("Summary:");
      for (let {description, signal, status} of summary) {
        logInfo("%s >> %j", description, signal === null ? status : signal);
      }
    }
  };
  return {
    mainAsync: ({cwd, stdout, stderr, argv}) => {
      cwd = cwd();
      const { _:command, configuration:path1, repository:path2  ... configuration_data} = {
        configuration: `${cwd}/appmap.yml`,
        repository: cwd,
        ... minimist(argv.slice(2)),
      };
      let configuration = createConfiguration(path2);
      let content = "{}";
      try {
        content = await readFile(path1, "utf8");
      } catch (error) {
        const {code} = {code:null, ...error};
        assert(code === "ENOENT", "failed to load configuration >> %e", error);
        logWarning("Missing configuration file: %s", path1);
      }
      content = assertSuccess(
        () => parseYAML(content),
        "failed to parse configuration file: %s >> %e",
        path1
      );
      const {children} = {children:[], ... content};
      const bound_children = free_children.map((child) => ({path:path1, child}));
      configuration = extendConfiguration(content, path1);
      configuration = extendConfiguration(configuration_data, cwd);
      if (command.length > 0) {
        children.push({data: {
          type: "spawn",
          exec: command[0],
          argv: command.slice(1),
        }, path:cwd});
      }
      const compiled_children = bound_children.flatMap(({path, child}) => compileChild(child, path, env, configuration));
      const {protocol} = configuration;
      if (protocol === "inline") {
        await runAllAsync(compiled_children, env, configuration);
      } else {
        const server = await createServerAsync({host:"localhost", port});
        try {
          await runAsync(compiled_children, env, configuration);
        } finally {
          closeServer(server);
          await promiseServerTermination(server);
        }
      }
    },
  };
}
