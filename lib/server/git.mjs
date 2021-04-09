import * as ChildProcess from 'child_process';
import logger from './logger.mjs';

const trim = (string) => string.trim();

const format = (command, path, reason, detail, stderr) =>
  `Command failure cwd=${path}: ${command} >> ${reason} ${detail} ${stderr}`;

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

const parseStatus = (status) => {
  /* c8 ignore start */
  if (status === null) {
    return null;
  }
  /* c8 ignore stop */
  return status.split('\n').map(trim);
};

const parseDescription = (description) => {
  /* c8 ignore start */
  if (description === null) {
    return null;
  }
  /* c8 ignore stop */
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
  /* c8 ignore stop */
  return result.stdout.trim();
};

export default (path) => {
  if (run(`git rev-parse --git-dir`, path) === null) {
    logger.warning(`Not a git repository`);
    return null;
  }
  return {
    repository: run(`git config --get remote.origin.url`, path),
    branch: run(`git rev-parse --abbrev-ref HEAD`, path),
    commit: run(`git rev-parse HEAD`, path),
    status: parseStatus(run(`git status --porcelain`, path)),
    tag: run(`git describe --abbrev=0 --tags`, path),
    annotated_tag: run(`git describe --abbrev=0`, path),
    commits_since_tag: parseDescription(run(`git describe --long --tag`, path)),
    commits_since_annotated_tag: parseDescription(
      run(`git describe --long`, path),
    ),
  };
};
