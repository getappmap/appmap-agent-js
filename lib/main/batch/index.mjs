
import Child from "./child.mjs";

export default (dependencies) => {
  const {server:{openServerAsync, closeServer, promiseServerTermination}} = dependencies;
  const {compileChild} = Child(dependencies);
  const runAsync = (children, {protocol, port, conf}) => {
    const context = {protocol, port, conf, repo:dirname(conf)};
    const compiled_children = children.flatMap((child) => compileChild(child, context));
    const results = [];
    for (const child of children) {
      for (const {exec, argv, options, description} of compileChild(child, context)) {
        logInfo(`${description} ...`);
        const child = spawn(exec, argv, options);
        results.push(
          await new _Promise((resolve, reject) => {
            child.on('exit', (status, signal) => {
              if (signal !== null) {
                logInfo(`> Killed with: ${signal}`);
              } else {
                logInfo(`> Exited with: ${_String(status)}`);
              }
              resolve({description, signal, status});
            });
            child.on("error", reject);
          }),
        );
      }
    }
    return results;
  };
  return {
    runAsync: (children, path) => {

    },
  };


    main: ({cwd, stdout, stderr}) => {
      const path = cwd();
      const {children, port, protocol, ... rest} = {
        children: [],
        ... parse(await readFile(`${cwd()}/.appmap.yml`, "utf8")),
      };
      const {port, protocol} = extendConfiguration(
        createConfiguration(path),
        rest,
        path,
      );
      if (protocol === "inline") {
        return await runAsync(children, {stdout, stderr, protocol, port:0, cwd:path});
      }
      const server = await openServerAsync({host:"localhost", port});
      try {
        return await runAsync(children, {stdout, stderr, protocol port:getServerPort(server), cwd:path});
      } finally {
        closeServer(server);
        await promiseServerTermination(server);
      }
    },
  };
}
