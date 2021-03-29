import Chalk from 'chalk';
import { lib, src } from './ordering.mjs';
import { spawnSync } from './spawn.mjs';

lib.forEach((target) => {
  process.stdout.write(Chalk.blue(`lib >> ${target}${'\n'}`));
  spawnSync(
    `npx c8 --reporter=text-summary --check-coverage --branches 100 --functions 100 --lines 100 --statements 100 --include lib/${target}.mjs node test/unit/lib/${target}.mjs`,
  );
});

src.forEach((target) => {
  process.stdout.write(Chalk.blue(`src >> ${target}${'\n'}`));
  spawnSync(
    `npx nyc --hook-run-in-this-context --reporter=text-summary --check-coverage --branches 100 --functions 100 --lines 100 --statements 100 --include src/${target}.js node test/unit/src/${target}.mjs`,
  );
});
