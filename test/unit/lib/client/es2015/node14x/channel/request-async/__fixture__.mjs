import { strict as Assert } from 'assert';
import * as ChildProcess from 'child_process';
import * as Path from 'path';
import { fileURLToPath } from 'url';

export const test = (protocol, makeRequestAsync) => {
  const child = ChildProcess.fork(
    Path.join(
      Path.dirname(fileURLToPath(import.meta.url)),
      '..',
      '__fixture_http_server__.mjs',
    ),
    [protocol, '0'],
    {
      stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
    },
  );

  child.on('exit', (code, signal) => {
    Assert.equal(code, null);
    Assert.equal(signal, 'SIGINT');
  });

  child.on('message', async (port) => {
    const requestAsync = makeRequestAsync('localhost', port);
    Assert.equal(
      await requestAsync({ status: 200, body: 'null' }, false),
      null,
    );
    child.kill('SIGINT');
  });
};
