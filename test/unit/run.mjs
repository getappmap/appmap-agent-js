import * as FileSystem from 'fs';
import * as Path from 'path';
import Chalk from 'chalk';
import { server, client } from './ordering.mjs';
import cover from './cover.mjs';

let status = 0;

if (process.argv.length === 2) {
  const done = [];
  const step = (path1, path2) => {
    done.push(path1);
    done.push(path2);
    process.stdout.write(Chalk.blue(`${path1}${'\n'}${path2}${'\n'}`));
    cover(path1, path2, null);
    process.stdout.write('\n\n');
  };
  server.forEach((target) => {
    step(`lib/server/${target}.mjs`, `test/unit/lib/server/${target}.mjs`);
  });
  client.forEach((target) => {
    step(`lib/client/${target}.js`, `test/unit/lib/client/${target}.mjs`);
  });
  step('lib/home.js', 'test/unit/lib/home.mjs');
  const miss = [];
  const loop = (path) => {
    if (path.includes('.')) {
      if (
        (path.endsWith('.js') || path.endsWith('.mjs')) &&
        (!path.startsWith('test/unit/') ||
          !Path.basename(path).startsWith('__fixture')) &&
        !done.includes(path)
      ) {
        miss.push(path);
      }
    } else {
      FileSystem.readdirSync(path)
        .map((filename) => Path.join(path, filename))
        .forEach(loop);
    }
  };
  loop('lib/');
  loop('test/unit/lib/');
  if (miss.length > 0) {
    process.stdout.write(Chalk.red(`Missing:${'\n'}${miss.join('\n')}${'\n'}`));
    status = 1;
  } else {
    process.stdout.write(Chalk.green('Victoly >> 100% coverage!\n'));
  }
} else if (process.argv.length === 3) {
  const path1 = process.argv[2];
  let path2 = `test/unit/${path1}`;
  if (process.argv[2].endsWith('.js')) {
    path2 = `test/unit/${path1.substring(0, path1.length - 3)}.mjs`;
  }
  cover(path1, path2, { reporter: 'html', check: false });
} else {
  process.stderr.write('Usage: node test/run.mjs [target.js]');
  status = 1;
}

process.exit(status);
