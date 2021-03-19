import * as ChildProcess from 'child_process';
import Logger from './logger.mjs';

const logger = new Logger(import.meta.url);

const trim = (string) => string.trim();

const format = (command, path, reason, detail, stderr) =>
  `Command failure cwd=${path}: ${command} >> ${reason} ${detail}${
    stderr === '' ? '' : `${'\n'}${stderr}`
  }`;

const spawnSync = (command, path) => {
  const result = ChildProcess.spawnSync(
    command.split(' ')[0],
    command.split(' ').slice(1),
    {
      cwd: path,
      encoding: 'utf8',
      timeout: 1000,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  /* c8 ignore start */
  if (Reflect.getOwnPropertyDescriptor(result, 'error') !== undefined) {
    logger.warning(
      format(command, path, 'failed with', result.error.message, result.stderr),
    );
    return null;
  }
  if (result.signal !== null) {
    logger.warning(
      format(
        command,
        path,
        'killed with',
        String(result.signal),
        result.stderr,
      ),
    );
    return null;
  }
  /* c8 ignore stop */
  return result;
};

const parseDescription = (description) => {
  if (description === null) {
    return null;
  }
  const parts = /^([^-]*)-([0-9]+)-/.exec(description);
  /* c8 ignore start */
  if (parts === null) {
    logger.warning(`Failed to parse git description, got: ${description}`);
    return null;
  }
  /* c8 ignore stop */
  return parseInt(parts[2], 10);
};

const run = (command, path) => {
  const result = spawnSync(command, path);
  /* c8 ignore start */
  if (result === null) {
    return null;
  }
  /* c8 ignore stop */
  if (result.status !== 0) {
    logger.warning(
      format(
        command,
        path,
        'exit with status',
        String(result.status),
        result.stderr,
      ),
    );
    return null;
  }
  return result.stdout.trim();
};

export default class Git {
  constructor(path = process.cwd()) {
    this.path = path;
  }
  isRepository() {
    const result = spawnSync(`git rev-parse --git-dir`, this.path);
    return result !== null && result.status === 0;
  }
  getRepositoryURL() {
    return run(`git config --get remote.origin.url`, this.path);
  }
  getBranchName() {
    return run(`git rev-parse --abbrev-ref HEAD`, this.path);
  }
  getCommitHash() {
    return run(`git rev-parse HEAD`, this.path);
  }
  getStatus() {
    const result = run(`git status --porcelain`, this.path);
    if (result === null) {
      return null;
    }
    return result.split('\n').map(trim);
  }
  getLatestTag() {
    return run(`git describe --abbrev=0 --tags`, this.path);
  }
  getLatestAnnotatedTag() {
    return run(`git describe --abbrev=0`, this.path);
  }
  getCommitNumberSinceLatestTag() {
    return parseDescription(run(`git describe --long --tag`, this.path));
  }
  getCommitNumberSinceLatestAnnotatedTag() {
    return parseDescription(run(`git describe --long`, this.path));
  }
}
