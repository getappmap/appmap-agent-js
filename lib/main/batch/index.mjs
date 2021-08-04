import minimist from "minimist";
import YAML from "yaml";
import { readFile } from "fs/promises";
import Child from "./child.mjs";

const { parse: parseYAML } = YAML;

export default (dependencies) => {
  const {
    log: { logInfo, logWarning },
    assert: { assert, assertSuccess, assertSuccessAsync },
    spawn: { spawnAsync },
    server: { openServerAsync, closeServer, promiseServerTermination },
    configuration: { createConfiguration, extendConfiguration },
  } = dependencies;
  const { compileChild } = Child(dependencies);
  const runOneAsync = async ({ exec, argv, options, description }) => {
    logInfo("%s ...", description);
    const { signal, status } = await assertSuccessAsync(
      spawnAsync(exec, argv, options),
      "child error %s >> %e",
      description,
    );
    if (signal !== null) {
      logInfo("> Killed with: %s", signal);
    } else {
      logInfo("> Exited with: %j", status);
    }
    return { description, signal, status };
  };
  const runAllAsync = async (compiled_children) => {
    const { length } = compiled_children;
    if (length === 0) {
      logWarning(
        "No children found to spawn, instructions to spawn children should be placed in the configuration file in the children field or alternatively provide a command to spawn as positional arguments",
      );
    } else if (length === 1) {
      await runOneAsync(compiled_children[0]);
    } else {
      logInfo("Spawning %j children sequentially", length);
      const summary = [];
      for (let index = 0; index < length; index += 1) {
        logInfo("%j/%j", index, length);
        summary.push(await runOneAsync(compiled_children[index]));
      }
      logInfo("Summary:");
      for (const { description, signal, status } of summary) {
        logInfo("%s >> %j", description, signal === null ? status : signal);
      }
    }
  };
  return {
    mainAsync: async ({ cwd, argv, env }) => {
      cwd = cwd();
      const {
        _: command,
        configuration: path1,
        repository: path2,
        ...configuration_data
      } = {
        configuration: `${cwd}/appmap.yml`,
        repository: cwd,
        ...minimist(argv.slice(2)),
      };
      const configuration1 = createConfiguration(path2);
      let content = "{}";
      try {
        content = await readFile(path1, "utf8");
      } catch (error) {
        const { code } = { code: null, ...error };
        assert(code === "ENOENT", "failed to load configuration >> %e", error);
        logWarning("Missing configuration file: %s", path1);
      }
      content = assertSuccess(
        () => parseYAML(content),
        "failed to parse configuration file: %s >> %e",
        path1,
      );
      const { children } = { children: [], ...content };
      const bound_children = children.map((child) => ({ path: path1, child }));
      const configuration2 = extendConfiguration(
        configuration1,
        content,
        path1,
      );
      const configuration3 = extendConfiguration(
        configuration2,
        configuration_data,
        cwd,
      );
      if (command.length > 0) {
        bound_children.push({
          child: {
            type: "spawn",
            exec: command[0],
            argv: command.slice(1),
          },
          path: cwd,
        });
      }
      const compiled_children = bound_children.flatMap(({ path, child }) =>
        compileChild(child, path, env, configuration3),
      );
      const { protocol } = configuration3;
      if (protocol === "inline") {
        await runAllAsync(compiled_children);
      } else {
        const { port } = configuration3;
        const server = await openServerAsync({ host: "localhost", port });
        try {
          await runAllAsync(compiled_children);
        } finally {
          closeServer(server);
          await promiseServerTermination(server);
        }
      }
    },
  };
};
