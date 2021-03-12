import * as ChildProcess from 'child_process';
import minimist from 'minimist';
import Chalk from 'chalk';

const spawnSync = (command) => {
  console.log(Chalk.magenta(command));
  const result = ChildProcess.spawnSync(
    command.split(' ')[0],
    command.split(' ').slice(1),
    { stdio: 'inherit' },
  );
  if (Reflect.getOwnPropertyDescriptor(result, 'error') !== undefined) {
    throw result.error;
  }
  if (result.signal !== null) {
    throw new Error(`Killed with ${String(result.signal)}`);
  }
  if (result.status !== 0) {
    throw new Error(`Exit status ${String(result.status)}`);
  }
};

const prettify = (path) => spawnSync(`npx prettier --write ${path}`);

const lint = (path) => spawnSync(`npx eslint ${path}`);

const test = (path) => spawnSync(`node ${path}`);

const testGraphicalCoverage = (path1, path2) => {
  spawnSync(
    `npx c8 --reporter=html --report-dir=coverage --include ${path1} node ${path2}`,
  );
  spawnSync(`open coverage/index.html`);
};

const testTextualCoverage = (check, path1, path2) => {
  spawnSync(
    `npx c8 --reporter=text-summary${check ? ' --check-coverage --branches 100 --functions 100 --lines 100 --statements 100 ' : ' '}--include ${path1}.js node ${path2}.js`,
  );
};

const argv = Object.assign({target:null, check:false}, minimist(process.argv.slice(2)));

if (argv.target === null) {
  const path1 = process.argv[2];
  console.log(Chalk.bgMagenta(path1));
  prettify(path1);
  lint(path1);
  if (path1.startsWith('lib/')) {
    const path2 = `test/${path1.substring(4)}`;
    prettify(path2);
    lint(path2);
    test(path2);
    testGraphicalCoverage(path1, path2);
  }
} else {
  [
    'instrumenter/loggr.mjs',
    'instrumenter/env.mjs',
    'instrumenter/git.mjs',
    'instrumenter/appmap.mjs',
  ].forEach((path) => {
    const path1 = `lib/${path}`;
    const path2 = `test/${path}`;
    console.log(Chalk.bgMagenta(path1));
    prettify(path1);
    lint(path1);
    prettify(path2);
    lint(path2);
    test(path2);
    testTextualCoverage(argv.check, path1, path2);
  });
}
