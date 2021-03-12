import * as Assert from 'assert';
import * as Logger from '../../lib/instrumenter/logger.mjs';

const AssertStrict = Assert.strict;
const LoggerDefault = Logger.default;

class Writable {
  constructor() {
    this.content = '';
  }
  write(message, encoding) {
    AssertStrict.equal(encoding, 'utf8');
    this.content += message;
  }
  getContent() {
    return this.content;
  }
}

const writable1 = new Writable();
const logger1 = new LoggerDefault('name1', Logger.DEBUG, writable1);
let content1 = '';
AssertStrict.equal(logger1.getLevel(), Logger.DEBUG);
['debug', 'info', 'warning', 'error', 'critical'].forEach((name) => {
  AssertStrict.equal(logger1[name](name), undefined);
  content1 += `${name.toUpperCase()} name1 >> ${name}${'\n'}`;
});
AssertStrict.equal(writable1.getContent(), content1);

const writable2 = new Writable();
Logger.reloadGlobalLevel('CRITICAL');
const logger2 = new LoggerDefault('name2', undefined, writable2);
AssertStrict.equal(logger2.getLevel(), Logger.CRITICAL);
['debug', 'info', 'warning', 'error', 'critical'].forEach((name) => {
  AssertStrict.equal(logger2[name](name), undefined);
});
AssertStrict.equal(writable2.getContent(), 'CRITICAL name2 >> critical\n');
Logger.reloadGlobalLevel('DEBUG');
AssertStrict.equal(logger2.getLevel(), Logger.DEBUG);
Logger.reloadGlobalLevel('FOO');
AssertStrict.equal(logger2.getLevel(), Logger.DEBUG);
