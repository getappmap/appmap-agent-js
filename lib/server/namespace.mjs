const globals = {
  __proto__: null,
  UNDEFINED: null,
  EVENT_COUNTER: null,
  EMPTY_MARKER: null,
  GET_NOW: null,
  PROCESS_ID: null,
  SERIALIZE: null,
  SERIALIZE_PARAMETER: null,
  SERIALIZE_EXCEPTION: null,
  GET_CLASS_NAME: null,
  EMIT: null,
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
    if (!/[A-Za-z_$][0-9A-Za-z_$]+/.test(prefix)) {
      throw new Error(`Invalid prefix: ${prefix}`);
    }
    this.prefix = prefix;
  }
  checkCollision(identifier) {
    if (identifier.startsWith(this.prefix)) {
      throw new Error(
        `Base-level identifier should never start with the escape prefix ${this.prefix}, got: ${identifier}`,
      );
    }
  }
  getGlobal(name) {
    if (!(name in globals)) {
      throw new Error(`Invalid global identifier name: ${name}`);
    }
    return `${this.prefix}_GLOBAL_${name}`;
  }
  getLocal(name) {
    if (!(name in locals)) {
      throw new Error(`Invalid local identifier name: ${name}`);
    }
    return `${this.prefix}_LOCAL_${name}`;
  }
});
