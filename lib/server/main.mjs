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

const extractChilderen = (options) => {
  const childeren = extractArray(options, 'childeren');
  const positional = options._;
  delete options._;
  if (positional.length > 0) {
    return [...childeren, positional];
  }
  return childeren;
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

export const main = (cwd, writable, options) =>
  getInitialConfiguration()
    .extendWithData({
      cwd,
      extends: 'appmap.yml',
      childeren: extractChilderen(options),
      packages: extractArray(options, 'packages'),
      exclude: extractArray(options, 'exclude'),
      ...options,
    })
    .bindAsync(
      (configuration) =>
        new Promise((resolve, reject) => {
          const childeren = configuration.getChilderen();
          const summarize = (either, index) =>
            `${'\n'}  - #${String(index)}: ${
              childeren[index].description
            } >> ${either.either(summarizeLeft, summarizeRight)}`;
          let index = 0;
          const eithers = new Array(childeren.length).fill(null);
          let terminateAsync = () => Promise.resolve(new Right(null));
          const step = () => {
            if (index === childeren.length) {
              if (eithers.every(isNotNull)) {
                terminateAsync().then((either) => {
                  resolve(
                    either.bind(() => {
                      if (childeren.length > 1) {
                        writable.write(
                          `Summary:${eithers.map(summarize).join('')}${'\n'}`,
                        );
                      }
                      if (eithers.every(isRight)) {
                        return new Right(
                          Number(eithers.map(fromRight).some(isFailure)),
                        );
                      }
                      return new Left(
                        'there was some appmap-related errors on spawned childeren',
                      );
                    }),
                  );
                });
              }
            } else {
              const id = index;
              index += 1;
              writable.write(`#${id}: ${childeren[id].description} ...\n`);
              configuration
                .spawnChild(childeren[id])
                .mapLeft(prefixSpawningError)
                .bindAsync((child) => {
                  pipeBuffer(`#${id} stdout >>`, child.stdout, writable);
                  pipeBuffer(`#${id} stderr >>`, child.stderr, writable);
                  return new Promise((resolve) => {
                    child.on('error', (error) => {
                      resolve(new Left(`running error >> ${error.message}`));
                    });
                    child.on('exit', (status, signal) => {
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
                      writable.write(`#${id} failed with: ${message}${'\n'}`);
                    },
                    ({ status, signal }) => {
                      if (signal !== null) {
                        writable.write(`#${id} killed with: ${signal}${'\n'}`);
                      } else {
                        writable.write(`#${id} exit with: ${status}${'\n'}`);
                      }
                    },
                  );
                  step();
                });
            }
          };
          const run = () => {
            writable.write(
              `Spawing ${
                childeren.length
              } childeren (max ${configuration.getConcurrency()} concurrent childeren) ...${'\n'}`,
            );
            const length = Math.max(
              1,
              Math.min(
                configuration.getConcurrency(),
                configuration.getChilderen().length,
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
