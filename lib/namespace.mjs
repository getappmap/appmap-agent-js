import Logger from './logger.mjs';

const logger = new Logger(import.meta.url);

const globals = {
  __proto__: null,
  APPMAP_OBJECT: null,
  UNDEFINED: null,
  EVENT_COUNTER: null,
  EMPTY_MARKER: null,
  GET_NOW: null,
  PROCESS_ID: null,
  SERIALIZE: null,
  SERIALIZE_PARAMETER: null,
  SERIALIZE_EXCEPTION: null,
  GET_CLASS_NAME: null,
  SEND: null,
  GET_IDENTITY: null,
};

const locals = {
  __proto__: null,
  EVENT_IDENTITY: null,
  ARGUMENT: null,
  ERROR: null,
  SUCCESS: null,
  FAILURE: null,
  TIMER: null,
};

export default (class Namespace {
  constructor(prefix) {
    this.prefix = prefix;
  }
  checkCollision(identifier) {
    if (identifier.startsWith(this.prefix)) {
      logger.error(
        `Base-level identifier should never start with ${this.prefix}, got: ${identifier}`,
      );
    }
  }
  compileGlobal(identifier) {
    if (!identifier.startsWith('APPMAP_GLOBAL_')) {
      logger.error(
        `Global appmap identifiers should start with "APPMAP_GLOBAL_", got: ${identifier}`,
      );
      return identifier;
    }
    const name = identifier.substring('APPMAP_GLOBAL_'.length);
    if (!(name in globals)) {
      logger.error(
        `compileGlobal >> Unrecognized global appmap name, got: ${identifier}`,
      );
    }
    return `${this.prefix}_GLOBAL_${name}`;
  }
  getGlobal(name) {
    if (!(name in globals)) {
      logger.error(
        `getGlobal >> Unrecognized global appmap name, got: ${name}`,
      );
    }
    return `${this.prefix}_GLOBAL_${name}`;
  }
  getLocal(name) {
    if (!(name in locals)) {
      logger.error(`getLocal >> Unrecognized local appmap name, got: ${name}`);
    }
    return `${this.prefix}_LOCAL_${name}`;
  }
});
