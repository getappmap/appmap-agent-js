import Chalk from 'chalk';
import { server, client } from './ordering.mjs';
import { spawnSync } from './spawn.mjs';

if (process.argv.length === 2) {
  const check =
    '--check-coverage --branches 100 --functions 100 --lines 100 --statements 100';

  const run = (path1, path2) => {
    process.stdout.write(Chalk.blue(`src >> ${path1}${'\n'}`));
    if (path1 === 'lib/client/es2015/script.js') {
      spawnSync(
        `npx nyc --reporter=text-summary --hook-run-in-this-context ${check} --temp-dir tmp/nyc-temp/ --include ${path1} node ${path2}`,
      );
    } else {
      spawnSync(
        `npx c8 --reporter=text-summary ${check} --temp-directory tmp/c8-temp/ --include ${path1} node ${path2}`,
      );
    }
  };

  server.forEach((target) => {
    run(`lib/server/${target}.mjs`, `test/unit/lib/server/${target}.mjs`);
  });

  client.forEach((target) => {
    run(`lib/client/${target}.js`, `test/unit/lib/client/${target}.mjs`);
  });
} else {
  const path1 = process.argv[2];

  let path2 = `test/unit/${path1}`;

  if (process.argv[2].endsWith('.js')) {
    path2 = `test/unit/${path1.substring(0, path1.length - 3)}.mjs`;
  }

  if (path1 === 'lib/client/es2015/script.js') {
    spawnSync(
      `npx nyc --hook-run-in-this-context --reporter=html --report-dir=tmp/coverage --include ${path1} node ${path2}`,
    );
  } else {
    spawnSync(
      `npx c8 --reporter=html --report-dir=tmp/coverage --include ${path1} node ${path2}`,
    );
  }
  spawnSync(`open tmp/coverage/index.html`);
}
