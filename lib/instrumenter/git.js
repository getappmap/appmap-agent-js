'use strict';

const child_process = require('child_process');

const options = {
  encoding: 'utf8',
  timeout: 1000,
  // cwd: __dirname,
  stdio: ['ignore', 'pipe', 'pipe'],
};

const failure = (command, args, reason, stderr) => {
  process.stderr.write(
    `${command} ${args.join(' ')} ${reason}${'\n'}${stderr}`,
    'utf8'
  );
};

const run = (command, args) => {
  const result = child_process.spawnSync(command, args, options);
  if (result.error) {
    failure(command, args, `fail ${result.error.message}`, result.stderr);
    return null;
  }
  if (result.signal !== null) {
    failure(command, args, `kill ${String(result.signal)}`, result.stderr);
    return null;
  }
  if (result.status !== 0) {
    failure(command, args, `status ${result.status}`, result.stderr);
    return null;
  }
  if (result.stdout[result.stdout.length - 1] === '\n') {
  }
  return result.stdout.trim();
};

exports.isRepository = () => {
  const command = 'git';
  const args = ['rev-parse', '--git-dir'];
  const result = child_process.spawnSync(command, args, options);
  if (result.error) {
    failure(command, args, `fail ${result.error.message}`, result.stderr);
    return false;
  }
  if (result.signal !== null) {
    failure(command, args, `kill ${String(result.signal)}`, result.stderr);
    return false;
  }
  return result.status === 0;
};

exports.getRepositoryURL = () =>
  run('git', ['config', '--get', 'remote.origin.url']);

exports.getBranchName = () => run('git', ['rev-parse', '--abbrev-ref', 'HEAD']);

exports.getCommitHash = () => run('git', ['rev-parse', 'HEAD']);
