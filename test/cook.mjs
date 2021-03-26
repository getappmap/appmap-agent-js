import * as ChildProcess from 'child_process';
import minimist from 'minimist';
import Chalk from 'chalk';

const spawnSync = (command) => {
  process.stdout.write(`${Chalk.magenta(command)}${'\n'}`);
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

const cook = (path, raw) => {
  if (!raw) {
    spawnSync(`npx prettier --write ${path}`);
    spawnSync(`npx eslint ${path}`);
  }
};

const test = (instrumenter, batch, target, unit) => {
  spawnSync(`node ${unit}`);
  if (batch) {
    spawnSync(
      `npx ${instrumenter} --reporter=text-summary --check-coverage --branches 100 --functions 100 --lines 100 --statements 100 --include ${target} node ${unit}`,
    );
  } else {
    spawnSync(
      `npx ${instrumenter} --reporter=html --report-dir=coverage --include ${target} node ${unit}`,
    );
    spawnSync(`open coverage/index.html`);
  }
};

const run = (target, raw, batch) => {
  process.stdout.write(`${Chalk.bgMagenta(target)}${'\n'}`);
  cook(target, raw);
  if (target.startsWith('lib/') && target.endsWith('.mjs')) {
    const unit = `test/unit/${target}`;
    cook(unit, raw);
    test('c8', batch, target, unit);
  }
  if (target.startsWith('src/') && target.endsWith('.js')) {
    const unit = `test/unit/${target.substring(0, target.length - 3)}.mjs`;
    cook(unit, raw);
    test('nyc --hook-run-in-this-context', batch, target, unit);
  }
};

const main = (argv) => {
  if (argv.target !== null) {
    return run(argv.target, argv.raw, false);
  }
  [
    /////////
    // src //
    /////////
    // indep //
    'src/es2015/node/process-id.js',
    'src/es2015/empty-marker.js',
    'src/es2015/undefined.js',
    'src/es2015/event-counter.js',
    'src/es2015/get-now.js',
    // serialize //
    'src/es2015/get-identity.js',
    'src/es2015/get-class-name.js',
    'src/es2015/serialize.js', // empty-marker
    'src/es2015/serialize-parameter.js', // serialize, get-class-name, get-identity
    'src/es2015/serialize-exception.js', // empty-marker, serialize, get-class-name, get-identity
    // send //
    'src/es2015/node/send/local.js',
    'src/es2015/node/setup-engine.js', // send
    'src/es2015/node/setup-archive.js', // send, serialize
    /////////
    // lib //
    /////////
    'lib/logger.mjs',
    'lib/bundle.mjs',
    'lib/settings.mjs',
    'lib/git.mjs',
    'lib/appmap.mjs',
    'lib/namespace.mjs',
    'lib/file.mjs',
    'lib/instrument/location.mjs',
    'lib/instrument/visit.mjs',
    'lib/instrument/visit-class.mjs',
    'lib/instrument/visit-closure.mjs',
    'lib/instrument/visit-expression.mjs',
    'lib/instrument/visit-identifier.mjs',
    'lib/instrument/visit-pattern.mjs',
    'lib/instrument/visit-program.mjs',
    'lib/instrument/visit-statement.mjs',
    'lib/instrument/index.mjs',
    'lib/main.mjs',
  ].forEach((path) => {
    run(path, argv.raw, true);
  });
};

main({
  target: null,
  raw: false,
  ...minimist(process.argv.slice(2)),
});
