
import {Left, Right} from "./either.mjs";
import {getInitialConfiguration} from "./configuration/index.mjs";
import {makeDispatching} from "./dispatching.mjs";
import {getProtocol} from "./protocol/index.mjs";

const spawnAsync = (child, configuration) => new Promise((resolve, reject) => {
  configuration.spawnChild(child).either((message) => resolve(new Left(message)), (child) => {
    let stderr = null;
    let stdout = null;
    if (child.stdout !== null) {
      stdout = "";
      child.stdout.on('data', (data) => { stdout += data; });
    }
    if (child.stderr !== null) {
      stderr = "";
      child.stderr.on('data', (data) => { stderr += data; });
    }
    child.on('error', (error) => {
      resolve(new Left(`error on child process >> ${error.message}`));
    });
    child.on('exit', (code, signal) => {
      resolve(new Right({code, signal, stderr, stdout}));
    });
  });
});

export const createServerAsync = (createServer, port) => new Promise((resolve, reject) => {
  const server = createServer();
  server.on('error', (error) => {
    resolve(new Left(`failed to listen to port ${port} >> ${error.message}`));
  });
  server.on("listening", () => {
    resolve(new Right(server));
  });
  server.listen(port);
});

export const main = (process, options) => getInitialConfiguration()
  .extendWithData(options, process.cwd())
  .bindAsync((configuration) => {
    const protocol = configuration.getProtocol();
    if (protocol === "inline") {
      return Promise.resolve(new Right({server:null, configuration}));
    }
    const {createServer, attach} = getProtocol(protocol);
    return createServerAsync(createServer, configuration.getPort()).then((either) => either.mapRight((server) => {
      attach(server, makeDispatching(configuration));
      return {
        server,
        configuration: configuration.extendWithData({
          port: server.address().port,
        }, "/").fromRight()
      };
    }));
  })
  .bindAsync(({server, configuration}) => {
    const iterator = configuration.getChilderen()[Symbol.iterator]();
    let code = 0;
    const runAsync = async () => {
      /* eslint-disable no-constant-condition */
      while (true) {
        /* eslint-enable no-constant-condition */
        const {done, value} = iterator.next();
        if (done) {
          return null;
        }
        const either = await spawnAsync(value, configuration);
        process.stdout.write([value.exec, ... value.argv].join(" "));
        either.either((message) => {
          code = 1;
          process.stdout.write(` failure >> ${message}${"\n"}`);
        }, ({code, signal, stdout, stderr}) => {
          if (signal === null) {
            if (code !== 0) {
              code = 1;
            }
            process.stdout.write(` exit with ${String(code)}${"\n"}`);
          } else {
            code = 1;
            process.stdout.write(` killed with ${signal}${"\n"}`);
          }
          if (stdout !== null && stdout !== "") {
            process.stdout.write("stdout:\n");
            process.stdout.write(stdout);
            process.stdout.write("\n");
          }
          if (stderr !== null && stderr !== "") {
            process.stdout.write("stderr:\n");
            process.stdout.write(stderr);
            process.stdout.write("\n");
          }
        });
      }
    };
    return Promise.all(new Array(configuration.getConcurrency()).map(() => runAsync())).then(() => code);
  });
