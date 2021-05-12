import { Left, Right } from './either.mjs';
import { getInitialConfiguration } from './configuration/index.mjs';
import { Dispatching } from './dispatching.mjs';
import { getProtocol } from './protocol/index.mjs';

export const createServerAsync = (createServer, port) =>
  new Promise((resolve, reject) => {
    const server = createServer();
    server.on('error', (error) => {
      resolve(new Left(`failed to listen to port ${port} >> ${error.message}`));
    });
    server.on('listening', () => {
      resolve(new Right(server));
    });
    server.listen(port);
  });

export const closeServerAsync = (server) =>
  new Promise((resolve, reject) => {
    server.on('error', reject);
    server.on('close', resolve);
    server.close();
  });

export const main = async (process, options) => {
  let either;
  let configuration = getInitialConfiguration();
  either = configuration
    .extendWithData(
      {
        extend: 'appmap.yml',
        ...options,
      },
      process.cwd(),
    )
    .mapRight((argument) => {
      configuration = argument;
    });
  let terminateAsync = (code) => Promise.resolve(new Right(code));
  either = await either.bindAsync(async () => {
    const protocol = configuration.getProtocol();
    if (protocol === 'inline') {
      return new Right(null);
    }
    const { createServer, attach } = getProtocol(protocol);
    return (
      await createServerAsync(createServer, configuration.getPort())
    ).mapRight((server) => {
      configuration = configuration
        .extendWithData(
          {
            port: server.address().port,
          },
          '/',
        )
        .fromRight();
      const dispatching = new Dispatching(configuration);
      attach(server, dispatching);
      terminateAsync = async (code) => {
        await dispatching.terminateAsync();
        await closeServerAsync(server);
        return code;
      };
      return null;
    });
  });
  either = await either.bindAsync(
    () =>
      new Promise((resolve, reject) => {
        const iterator = configuration.getChilderen()[Symbol.iterator]();
        let concurent = configuration.getConcurrency();
        let code = 0;
        const step = () => {
          const { done, value } = iterator.next();
          if (done) {
            concurent -= 1;
            if (concurent === 0) {
              resolve(new Right(code));
            }
          } else {
            configuration.spawnChild(value).either(
              (message) => {
                resolve(new Left(message));
              },
              (child) => {
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
                child.on('error', (error) => {
                  resolve(
                    new Left(`error on child process >> ${error.message}`),
                  );
                });
                child.on('exit', (code, signal) => {
                  process.stdout.write([this.spawnargs].join(' '));
                  if (signal !== null) {
                    code = 1;
                    process.stdout.write(` killed with ${signal}${'\n'}`);
                  } else {
                    if (code !== 0) {
                      code = 1;
                    }
                    process.stdout.write(` exit with ${String(code)}${'\n'}`);
                  }
                  if (this.stdout !== null && this.stdout !== '') {
                    process.stdout.write('stdout:\n');
                    process.stdout.write(stdout);
                    process.stdout.write('\n');
                  }
                  if (stderr !== null && stderr !== '') {
                    process.stdout.write('stderr:\n');
                    process.stdout.write(stderr);
                    process.stdout.write('\n');
                  }
                  step();
                });
              },
            );
          }
        };
        for (let index = 0; index < concurent; index += 1) {
          step();
        }
      }),
  );
  either = await either.bindAsync(terminateAsync);
  return either;
};
