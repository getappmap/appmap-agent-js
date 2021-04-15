import * as FileSystem from 'fs';
import * as ChildProcess from 'child_process';
import { strict as Assert } from 'assert';
import * as Agent from '../../lib/server/index.mjs';

ChildProcess.spawn('npm', ['run', 'build'], { stdio: 'inherit' }).on(
  'exit',
  (code, signal) => {
    Assert.equal(signal, null);
    Assert.equal(code, 0);

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

    const fork = (protocol, port, env) =>
      Agent.fork(
        'tmp/test/main.mjs',
        [],
        {
          stdio: 'inherit',
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

    const forkInline = (callback) =>
      fork('inline', null, process.env).on('exit', (code, signal) => {
        Assert.equal(signal, null);
        Assert.equal(code, 0);
        callback();
      });

    const forkDistributed = (protocol, callback) => {
      const env = { ...process.env };
      const server = Agent.createServer(protocol, env, {});
      // server.on('error', (error) => {
      //   console.log("SERVER ERROR", error);
      // });
      server.listen(0, () => {
        const child = fork(protocol, server.address().port, env);
        child.on('error', (error) => {
          console.log('CHILD', error);
          throw error;
        });
        child.on('exit', (code, signal) => {
          Assert.equal(signal, null);
          Assert.equal(code, 0);
          server.close();
          callback();
        });
      });
    };

    forkDistributed('http2', () => {
      console.log('DONE');
    });

    // forkInline(() => {
    //   forkDistributed("http1", () => {
    //     console.log("DONE");
    //     // forkDistributed("http1", () => {
    //     //   forkDistributed("http2", () => {
    //     //     process.stdout.write("\nDONE\n");
    //     //   });
    //     // });
    //   });
    // });
  },
);
