import globals from '../../dist/globals.mjs';

const locals = ['EVENT_ID', 'ARGUMENT', 'ERROR', 'SUCCESS', 'FAILURE', 'TIMER'];

export default (class Namespace {
  constructor(prefix) {
    if (!/^[A-Za-z_$][0-9A-Za-z_$]*$/u.test(prefix)) {
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
    if (!globals.includes(name)) {
      throw new Error(`Invalid global identifier name: ${name}`);
    }
    return `${this.prefix}_GLOBAL_${name}`;
  }
  getLocal(name) {
    if (!locals.includes(name)) {
      throw new Error(`Invalid local identifier name: ${name}`);
    }
    return `${this.prefix}_LOCAL_${name}`;
  }
});
