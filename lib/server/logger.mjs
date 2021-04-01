import * as Path from 'path';
import * as Url from 'url';

export const DEBUG = 1;
export const INFO = 2;
export const WARNING = 3;
export const ERROR = 4;
export const CRITICAL = 5;

let globalLevel = WARNING;

export default class Logger {
  constructor(
    name,
    level = null,
    writable = process.stderr,
    relative = process.cwd(),
  ) {
    this.name = name.startsWith('file:///')
      ? Path.relative(relative, new Url.URL(name).pathname)
      : name;
    this.level = level;
    this.writable = writable;
  }
  debug(message) {
    if ((this.level === null ? globalLevel : this.level) <= DEBUG) {
      this.writable.write(`DEBUG ${this.name} >> ${message}${'\n'}`, 'utf8');
    }
  }
  info(message) {
    if ((this.level === null ? globalLevel : this.level) <= INFO) {
      this.writable.write(`INFO ${this.name} >> ${message}${'\n'}`, 'utf8');
    }
  }
  warning(message) {
    if ((this.level === null ? globalLevel : this.level) <= WARNING) {
      this.writable.write(`WARNING ${this.name} >> ${message}${'\n'}`, 'utf8');
    }
  }
  error(message) {
    if ((this.level === null ? globalLevel : this.level) <= ERROR) {
      this.writable.write(`ERROR ${this.name} >> ${message}${'\n'}`, 'utf8');
    }
  }
  critical(message) {
    if ((this.level === null ? globalLevel : this.level) <= CRITICAL) {
      this.writable.write(`CRITICAL ${this.name} >> ${message}${'\n'}`, 'utf8');
    }
  }
  getLevel() {
    return this.level === null ? globalLevel : this.level;
  }
}

const logger = new Logger(import.meta.url);

export const reloadGlobalLevel = (level) => {
  const mapping = {
    __proto__: null,
    DEBUG,
    INFO,
    WARNING,
    ERROR,
    CRITICAL,
  };
  if (level.toUpperCase() in mapping) {
    globalLevel = mapping[level.toUpperCase()];
  } else {
    logger.warning(`Invalid APPMAP_LOG_LEVEL environment variable`);
  }
};

/* c8 ignore start */
if (
  Reflect.getOwnPropertyDescriptor(process.env, 'APPMAP_LOG_LEVEL') !==
  undefined
) {
  reloadGlobalLevel(process.env.APPMAP_LOG_LEVEL);
} else {
  logger.info(`No APPMAP_LOG_LEVEL environment variable provided`);
}
/* c8 ignore end */
