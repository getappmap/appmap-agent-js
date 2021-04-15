import * as FileSystem from 'fs';
import { strict as Assert } from 'assert';
import Chalk from 'chalk';
import * as Agent from '../../lib/server/index.mjs';

FileSystem.writeFileSync(
  'tmp/test/dependency.js',
  `module.exports = function dependency () {};`,
  'utf8',
);

FileSystem.writeFileSync(
  'tmp/test/main.mjs',
  `import dependency from "./dependency.js"; dependency();`,
  'utf8',
);

const fork = (protocol, port, env) => {
  const child = Agent.fork(
    'tmp/test/main.mjs',
    [],
    {
      stdio: 'pipe',
      encoding: 'utf8',
      env: {
        ...env,
        APPMAP_MAP_NAME: protocol,
      },
    },
    {
      protocol,
      port,
      cjs: true,
      esm: true,
    },
  );
  child.stdout.on('data', (data) => {
    process.stdout.write(Chalk.blue(data));
  });
  child.stderr.on('data', (data) => {
    process.stderr.write(Chalk.red(data));
  });
  return child;
};

const forkInline = (callback) =>
  fork('inline', null, process.env).on('exit', (code, signal) => {
    Assert.equal(signal, null);
    Assert.equal(code, 0);
    callback();
  });

const forkDistributed = (protocol, callback) => {
  const env = { ...process.env };
  const server = Agent.createServer(protocol, env, {});
  server.listen(0, () => {
    const child = fork(protocol, server.address().port, env);
    child.on('exit', (code, signal) => {
      Assert.equal(signal, null);
      Assert.equal(code, 0);
      server.close();
      callback();
    });
  });
};

forkInline(() => {
  forkDistributed('messaging', () => {
    forkDistributed('http1', () => {
      forkDistributed('http2', () => {
        process.stdout.write('\nDONE\n');
      });
    });
  });
});
