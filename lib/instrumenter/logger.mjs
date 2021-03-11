
const DEBUG = 1;
const INFO = 2;
const WARNING = 3;
const ERROR = 4;
const CRITICAL = 5;

let level = WARNING;

export default class Logger {

  constructor(name) {
    this.name = name;
  }

  debug(message) {
    if (level >= DEBUG) {
      process.stderr.write(`DEBUG ${this.name} >> ${message}${'\n'}`);
    }
  }

  info(message) {
    if (level >= DEBUG) {
      process.stderr.write(`INFO ${this.name} >> ${message}${'\n'}`);
    }
  }

  warning(message) {
    if (level >= WARNING) {
      process.stderr.write(`WARNING ${this.name} >> ${message}${'\n'}`);
    }
  }

  error(message) {
    if (level >= ERROR) {
      process.stderr.write(`ERROR ${this.name} >> ${message}${'\n'}`);
    }
  }

  critical(message) {
    if (level >= CRITICAL) {
      process.stderr.write(`CRITICAL ${this.name} >> ${message}${'\n'}`);
    }
  }
}

const logger = new Logger(import.meta.url);

if (
  Reflect.getOwnPropertyDescriptor(process.env, 'APPMAP_LOG_LEVEL') !==
  undefined
) {
  const mapping = {
    __proto__: null,
    DEBUG,
    INFO,
    WARNING,
    ERROR,
    CRITICAL,
  };
  if (process.env.APPMAP_LOG_LEVEL.toUpperCase() in mapping) {
    level = mapping[process.env.APPMAP_LOG_LEVEL.toUpperCase()];
  } else {
    logger.warning(
      `Invalid APPMAP_LOG_LEVEL environment variable, defaulting to WARNING`,
    );
  }
} else {
  logger.info(
    `No APPMAP_LOG_LEVEL environment variable provided, defaulting to WARNING`,
  );
}
