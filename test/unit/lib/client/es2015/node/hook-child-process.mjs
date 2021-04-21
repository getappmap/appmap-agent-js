import { strict as Assert } from 'assert';
import * as FileSystem from 'fs';
import * as Env from '../../../../../../lib/client/es2015/node/env.js';
import hookChildProcess from '../../../../../../lib/client/es2015/node/hook-child-process.js';

hookChildProcess('--require=./tmp/test/hook.js', {});

FileSystem.writeFileSync(
  'tmp/test/hook.js',
  `
    console.log(process.env.APPMAP_HOOK_CHILD_PROCESS);
    console.log(process.env.FOO);
  `,
  'utf8',
);

FileSystem.writeFileSync(
  'tmp/test/main.js',
  `
    console.log(JSON.stringify(process.execArgv));
    console.log(JSON.stringify(process.argv.slice(2)));
  `,
  'utf8',
);

const makeStdout = (foo, execArgv, argv) =>
  `true\n${foo}\n${JSON.stringify(execArgv)}\n${JSON.stringify(argv)}\n`;

const options = Env.extractOptions({
  APPMAP_HOOK_CHILD_PROCESS: 'true',
});

const origin = '--require=./tmp/test/hook.js';

hookChildProcess(origin, options);

import('child_process').then((ChildProcess) => {
  {
    const child = ChildProcess.spawnSync('pwd', { encoding: 'utf8' });
    Assert.equal(child.signal, null);
    Assert.equal(child.status, 0);
    Assert.equal(child.stderr, '');
    Assert.equal(child.stdout, `${process.cwd()}${'\n'}`);
  }

  Assert.throws(() => ChildProcess.spawnSync('node', 'foobar'), TypeError);

  {
    const argv = ['arg0', 'arg1'];
    const child = ChildProcess.spawnSync(
      'node',
      ['tmp/test/main.js', ...argv],
      {
        encoding: 'utf8',
        env: {
          ...process.env,
          FOO: 'bar',
        },
      },
    );
    Assert.equal(child.signal, null);
    Assert.equal(child.status, 0);
    Assert.equal(child.stderr, '');
    Assert.equal(child.stdout, makeStdout('bar', [origin], ['arg0', 'arg1']));
  }

  {
    if (Reflect.getOwnPropertyDescriptor(process.env, 'foo') !== undefined) {
      throw new Error('Unexpected env variable FOO');
    }
    process.env.FOO = 'bar';
    const child = ChildProcess.spawn('node', [
      'tmp/test/main.js',
      'arg0',
      'arg1',
    ]);
    delete process.env.FOO;
    child.stderr.on('data', (data) => {
      Assert.fail();
    });
    let stdout = '';
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (data) => {
      stdout += data;
    });
    child.on('exit', (status, signal) => {
      Assert.equal(signal, null);
      Assert.equal(status, 0);
      Assert.equal(stdout, makeStdout('bar', [origin], ['arg0', 'arg1']));
    });
  }

  {
    const child = ChildProcess.fork('tmp/test/main.js', {
      encoding: 'utf8',
      stdio: 'pipe',
      execArgv: ['--no-warnings'],
      env: {
        ...process.env,
        FOO: 'bar',
      },
    });
    child.stderr.on('data', (data) => {
      Assert.fail();
    });
    let stdout = '';
    child.stdout.on('data', (data) => {
      stdout += data;
    });
    child.on('exit', (status, signal) => {
      Assert.equal(signal, null);
      Assert.equal(status, 0);
      Assert.equal(stdout, makeStdout('bar', [origin, '--no-warnings'], []));
    });
  }

  {
    const save = process.execArgv;
    process.execArgv = ['--no-warnings'];
    const child = ChildProcess.fork('tmp/test/main.js');
    process.execArgv = save;
    child.on('exit', (status, signal) => {
      Assert.equal(signal, null);
      Assert.equal(status, 0);
    });
  }
});
