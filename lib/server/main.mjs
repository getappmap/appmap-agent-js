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

const extractChilderen = (options) => {
  const childeren = extractArray(options, 'childeren');
  const positional = options._;
  delete options._;
  if (positional.length > 0) {
    return [...childeren, positional];
  }
  return childeren;
};

const pipe = (prefix, readable, writable, callback) => {
  if (readable === null) {
    callback();
  } else {
    let content = '';
    readable.on('data', (data) => {
      content += data;
    });
    readable.on('end', () => {
      writable.write(
        `${prefix}${'\n  | '}${content.replace(/\n/g, '\n  | ')}${'\n'}`,
      );
      callback();
    });
  }
};

const isDefined = (any) => any !== undefined;

/* c8 ignore start */
const returnEmptyString = () => '';
/* c8 ignore stop */

const escape = (arg) => `'${arg.replace(/'/g, "\\'")}'`;

const prefixSpawningError = (string) => `spawning error >> ${string}`;

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
          const childeren = configuration.getChilderen();
          let index = 0;
          const eithers = new Array(childeren.length);
          let terminateAsync = () => Promise.resolve(new Right(null));
          const step = () => {
            if (index === childeren.length) {
              if (eithers.every(isDefined)) {
                terminateAsync().then((either) => {
                  resolve(
                    either.bind(() => {
                      if (eithers.every(isRight)) {
                        return new Right(
                          eithers
                            .map(fromRight)
                            .every(
                              ({ status, signal }) =>
                                signal === null && status === 0,
                            )
                            ? 0
                            : 1,
                        );
                      }
                      return new Left(
                        `child errors:${eithers
                          .map((either, index) =>
                            either.either(
                              (message) => `${'\n'}  - #${index} ${message}`,
                              returnEmptyString,
                            ),
                          )
                          .join('')}`,
                      );
                    }),
                  );
                });
              }
            } else {
              const id = index;
              index += 1;
              writable.write(
                `#${id} (out of ${childeren.length}): ${
                  childeren[id].exec
                } ${childeren[id].argv.map(escape).join(' ')} ...\n`,
              );
              configuration
                .spawnChild(childeren[id])
                .mapLeft(prefixSpawningError)
                .bindAsync(
                  (child) =>
                    new Promise((resolve) => {
                      child.on('error', (error) => {
                        resolve(new Left(`running error >> ${error.message}`));
                      });
                      child.on('exit', (status, signal) => {
                        pipe(`#${id} stdout >>`, child.stdout, writable, () => {
                          pipe(
                            `#${id} stderr >>`,
                            child.stderr,
                            writable,
                            () => {
                              resolve(
                                status === 123
                                  ? new Left(`client agent error`)
                                  : new Right({ status, signal }),
                              );
                            },
                          );
                        });
                      });
                    }),
                )
                .then((either) => {
                  assert(eithers[id] === undefined, 'child already done');
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
            const length = Math.max(
              1,
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
                .extendWithData(
                  {
                    port: server.address().port,
                  },
                  base,
                )
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
