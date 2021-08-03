
import Child from "./child.mjs";

export default (dependencies) => {
  const {server:{openServerAsync, closeServer, promiseServerTermination}} = dependencies;
  const {compileChild} = Child(dependencies);
  const runAsync = (children, {stdout, stderr, ...context}) => {
    const compiled_children = children.flatMap((child) => compileChild(child, context));
    for (const {exec, argv, options} of compiled_children) {
      stdout.write(`${exec} ${stringify(argv)}...`);
      const child = spawn(exec, argv, options);
      await new _Promise((resolve) => {
        child.on('exit', (status, signal) => {
          if (signal !== null) {
            stdout.write(`> Killed with: ${signal}`);
          } else {
            stdout.write(`> Exited with: ${_String(status)}`);
          }
          resolve();
        });
        child.on("error", (error) => {
          stderr.write(`> ${error.toString()}\n`);
          resolve();
        });
      });
    }
  };
  return {
    main: ({cwd, stdout, stderr}) => {
      const path = cwd();
      const {children, ... rest} = {
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
