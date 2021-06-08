import { assert } from './assert.mjs';
import { isRight, fromRight, Left, Right } from './either.mjs';
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

const isFailure = ({ status, signal }) => signal !== null || status !== 0;

const summarizeLeft = (message) => message;

const summarizeRight = ({ status, signal }) =>
  signal === null ? String(status) : signal;

const extractChildren = (options) => {
  const children = extractArray(options, 'children');
  const positional = options._;
  delete options._;
  if (positional.length > 0) {
    return [...children, positional];
  }
  return children;
};

const pipeBuffer = (prefix, readable, writable) => {
  if (readable !== null) {
    if (
      readable.readableEncoding === null ||
      readable.readableEncoding === 'buffer'
    ) {
      let content = [];
      readable.on('data', (data) => {
        content.push(data);
      });
      readable.on('end', () => {
        content = Buffer.concat(content);
        if (content.length > 0) {
          writable.write(`${prefix} ${content.toString('hex')}${'\n'}`);
        }
      });
    } else {
      let content = '';
      readable.on('data', (data) => {
        content += data;
      });
      readable.on('end', () => {
        if (content.length > 0) {
          writable.write(
            `${prefix}${'\n  | '}${content.replace(/\n/g, '\n  | ')}${'\n'}`,
          );
        }
      });
    }
  }
};

const isNotNull = (any) => any !== null;

const prefixSpawningError = (string) => `spawning error >> ${string}`;

export const main = (process, options) =>
  getInitialConfiguration()
    .extendWithData({
      cwd: process.cwd(),
      extends: 'appmap.yml',
      children: extractChildren(options),
      packages: extractArray(options, 'packages'),
      exclude: extractArray(options, 'exclude'),
      ...options,
    })
    .bindAsync(
      (configuration) =>
        new Promise((resolve, reject) => {
          let spawnings = configuration.getChildren();
          process.on('SIGINT', () => {
            spawnings = spawnings.slice(0, index);
            for (let child of children) {
              child.kill('SIGINT');
            }
          });
          const children = new Set();
          const summarize = (either, index) =>
            `${'\n'}  - #${String(index)}: ${
              spawnings[index].description
            } >> ${either.either(summarizeLeft, summarizeRight)}`;
          let index = 0;
          const eithers = new Array(spawnings.length).fill(null);
          let terminateAsync = () => Promise.resolve(new Right(null));
          const step = () => {
            if (index === spawnings.length) {
              if (eithers.every(isNotNull)) {
                terminateAsync().then((either) => {
                  resolve(
                    either.bind(() => {
                      if (spawnings.length > 1) {
                        process.stdout.write(
                          `Summary:${eithers.map(summarize).join('')}${'\n'}`,
                        );
                      }
                      if (eithers.every(isRight)) {
                        return new Right(
                          Number(eithers.map(fromRight).some(isFailure)),
                        );
                      }
                      return new Left(
                        'there was some appmap-related errors on spawned children',
                      );
                    }),
                  );
                });
              }
            } else {
              const id = index;
              index += 1;
              process.stdout.write(
                `#${id}: ${spawnings[id].description} ...\n`,
              );
              configuration
                .spawnChild(spawnings[id])
                .mapLeft(prefixSpawningError)
                .bindAsync((child) => {
                  children.add(child);
                  pipeBuffer(`#${id} stdout >>`, child.stdout, process.stdout);
                  pipeBuffer(`#${id} stderr >>`, child.stderr, process.stdout);
                  return new Promise((resolve) => {
                    child.on('error', (error) => {
                      children.delete(child);
                      resolve(new Left(`running error >> ${error.message}`));
                    });
                    child.on('exit', (status, signal) => {
                      children.delete(child);
                      resolve(
                        status === 123
                          ? new Left(`client agent error`)
                          : new Right({ status, signal }),
                      );
                    });
                  });
                })
                .then((either) => {
                  assert(
                    eithers[id] === null,
                    'child should not be already done',
                  );
                  eithers[id] = either;
                  either.either(
                    (message) => {
                      process.stdout.write(
                        `#${id} failed with: ${message}${'\n'}`,
                      );
                    },
                    ({ status, signal }) => {
                      if (signal !== null) {
                        process.stdout.write(
                          `#${id} killed with: ${signal}${'\n'}`,
                        );
                      } else {
                        process.stdout.write(
                          `#${id} exit with: ${status}${'\n'}`,
                        );
                      }
                    },
                  );
                  step();
                });
            }
          };
          const run = () => {
            process.stdout.write(
              `Spawing ${
                spawnings.length
              } children (max ${configuration.getConcurrency()} concurrent children) ...${'\n'}`,
            );
            const length = Math.max(
              1,
              Math.min(
                configuration.getConcurrency(),
                configuration.getChildren().length,
              ),
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
            const server = createServer();
            server.on('error', (error) => {
              server.removeAllListeners('error');
              server.removeAllListeners('listening');
              resolve(
                new Left(
                  `failed to listening to port ${configuration.getPort()} >> ${
                    error.message
                  }`,
                ),
              );
            });
            server.on('listening', () => {
              server.removeAllListeners('error');
              server.removeAllListeners('listening');
              configuration = configuration
                .extendWithData({
                  cwd: '/',
                  port: server.address().port,
                })
                .fromRight();
              const dispatching = new Dispatching(configuration);
              attach(server, dispatching);
              terminateAsync = () =>
                dispatching.terminateAsync().then((either) =>
                  either.bindAsync(
                    () =>
                      new Promise((resolve, reject) => {
                        server.removeAllListeners('error');
                        server.on(
                          'error',
                          /* c8 ignore start */ (error) => {
                            resolve(
                              new Left(
                                `server error during closing >> ${error.mesage}`,
                              ),
                            );
                          } /* c8 ignore stop */,
                        );
                        server.on('close', () => resolve(new Right(null)));
                        server.close();
                      }),
                  ),
                );
              run();
            });
            server.listen(configuration.getPort());
          }
        }),
    );
