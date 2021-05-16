import { assert } from './assert.mjs';
import { Left, Right } from './either.mjs';
import { getInitialConfiguration } from './configuration/index.mjs';
import { Dispatching } from './dispatching.mjs';
import { getProtocol } from './protocol/index.mjs';

const extractArray = (options, key) => {
  if (Reflect.getOwnPropertyDescriptor(options, key) === undefined) {
    return [];
  }
  const value = options[key];
  delete options[key];
  if (!Array.isArray(value)) {
    return [value];
  }
  return value;
};

const extractChilderen = (options) => {
  const childeren = extractArray(options, 'childeren');
  const positional = options._;
  delete options._;
  if (positional.length > 0) {
    return [...childeren, positional];
  }
  return childeren;
};

export const main = (base, writable, options) =>
  getInitialConfiguration()
    .extendWithData(
      {
        extends: 'appmap.yml',
        childeren: extractChilderen(options),
        packages: extractArray(options, 'packages'),
        exclude: extractArray(options, 'exclude'),
        ...options,
      },
      base,
    )
    .bindAsync(
      (configuration) =>
        new Promise((resolve, reject) => {
          const childeren = new Set();
          let code = 0;
          let server = null;
          let dispatching = null;
          const iterator = configuration.getChilderen()[Symbol.iterator]();
          const closeServer = (callback) => {
            if (server === null) {
              callback();
            } else {
              server.on('close', callback);
              server.close();
            }
          };
          const failure = (message) => {
            let counter = -1;
            const done = () => {
              counter += 1;
              if (counter === childeren.size) {
                closeServer(() => {
                  resolve(new Left(message));
                });
              }
            };
            done();
            for (let child of childeren) {
              child.removeAllListeners('exit');
              child.on('exit', done);
              child.kill('SIGKILL');
            }
          };
          const success = () => {
            assert(childeren.size === 0, 'expected empty childeren set');
            closeServer(() => {
              if (dispatching === null) {
                resolve(new Right(code));
              } else {
                dispatching.terminateAsync().then((either) => {
                  resolve(either.mapRight(() => code));
                });
              }
            });
          };
          const successSpawn = (child) => {
            childeren.add(child);
            let stderr = null;
            let stdout = null;
            if (child.stdout !== null) {
              stdout = '';
              child.stdout.on('data', (data) => {
                stdout += data;
              });
            }
            if (child.stderr !== null) {
              stderr = '';
              child.stderr.on('data', (data) => {
                stderr += data;
              });
            }
            child.on('exit', (status, signal) => {
              childeren.delete(child);
              writable.write(child.spawnargs.join(' '));
              if (signal !== null) {
                code = 1;
                writable.write(` killed with ${signal}${'\n'}`);
              } else {
                if (status !== 0) {
                  code = 1;
                }
                writable.write(` exit with ${String(status)}${'\n'}`);
              }
              if (stdout !== null && stdout !== '') {
                writable.write('stdout:\n');
                writable.write(stdout);
                writable.write('\n');
              }
              if (stderr !== null && stderr !== '') {
                writable.write('stderr:\n');
                writable.write(stderr);
                writable.write('\n');
              }
              step();
            });
          };
          const step = () => {
            const { done, value } = iterator.next();
            if (done) {
              if (childeren.size === 0) {
                success();
              }
            } else {
              configuration.spawnChild(value).either(failure, successSpawn);
            }
          };
          if (configuration.getChilderen().length === 0) {
            success();
          } else {
            const run = () => {
              const length = Math.max(
                configuration.getConcurrency(),
                configuration.getChilderen().length,
              );
              for (let index = 0; index < length; index += 1) {
                step();
              }
            };
            if (configuration.getProtocol() === 'inline') {
              run();
            } else {
              const { createServer, attach } = getProtocol(
                configuration.getProtocol(),
              );
              let server_ = createServer();
              server_.on('error', (error) => {
                server_.removeAllListeners('error');
                server_.removeAllListeners('listening');
                failure(
                  `failed to listening to port ${configuration.getPort()} >> ${
                    error.message
                  }`,
                );
              });
              server_.on('listening', () => {
                server_.removeAllListeners('error');
                server_.removeAllListeners('listening');
                server = server_;
                configuration
                  .extendWithData(
                    {
                      port: server.address().port,
                    },
                    base,
                  )
                  .either(failure, (configuration_) => {
                    configuration = configuration_;
                    dispatching = new Dispatching(configuration, failure);
                    attach(server, dispatching);
                    run();
                  });
              });
              server_.listen(configuration.getPort());
            }
          }
        }),
    );
