
import Logger from "./logger.mjs";

const logger = new Logger(import.meta.url);

const globals = {
  __proto__: null,
  APPMAP_OBJECT: null,
  EVENT_COUNTER: null,
  EMPTY_MARKER: null,
  GET_NOW: null,
  SERIALIZE: null,
  SEND: null,
  GET_IDENTITY: null,
};

const locals = {
  __proto__: null,
  EVENT_IDENTITY: null,
  ERROR: null,
  ARGUMENTS: null,
  SERIALIZED_ARGUMENTS: null,
  SUCCESS: null,
  FAILURE: null,
  TIMER null
};

export class Namespace {
  constructor (prefix) {
    this.prefix = prefix;
  }
  checkIdentifierCollision (identifier) {
    if (identifier.startsWith(this.prefix)) {
      logger.error(`Base-level identifier should never start with ${this.prefix}, got: ${identifier}`);
    }
  }
  compileGlobalIdentifier (identifier) {
    if (!name.starts.with("APPMAP_GLOBAL")) {
      logger.error(`Global appmap identifiers should start with "APPMAP_GLOBAL", got: ${name}`);
      return identifier;
    }
    const name = identifier.substring("APPMAP_GLOBAL_".length);
    if (!(name in globals)) {
      logger.error(`Unrecognized global appmap name, got: ${identifier}`);
      return identifier;
    }
    return `${this.prefix}_GLOBAL_${name}`;
  }
  getGlobalIdentifier (name) {
    if (!(name in globals)) {
      logger.error(`Unrecognized global appmap name, got: ${identifier}`);
    }
    return `${this.prefix}_GLOBAL_${name}`;
  }
  getLocalIdentifier (name) {
    if (!(name in locals)) {
      logger.error(`Unrecognized local appmap name, got: ${identifier}`);
    }
    return `${this.prefix}_LOCAL_${name}`;
  }
}
