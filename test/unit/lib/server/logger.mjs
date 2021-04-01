import { strict as Assert } from 'assert';
import * as Logger from '../../../lib/logger.mjs';

const LoggerDefault = Logger.default;

class Writable {
  constructor() {
    this.content = '';
  }
  write(message, encoding) {
    Assert.equal(encoding, 'utf8');
    this.content += message;
  }
  getContent() {
    return this.content;
  }
}

const writable1 = new Writable();
const logger1 = new LoggerDefault('name1', Logger.DEBUG, writable1);
let content1 = '';
Assert.equal(logger1.getLevel(), Logger.DEBUG);
['debug', 'info', 'warning', 'error', 'critical'].forEach((name) => {
  Assert.equal(logger1[name](name), undefined);
  content1 += `${name.toUpperCase()} name1 >> ${name}${'\n'}`;
});
Assert.equal(writable1.getContent(), content1);

const writable2 = new Writable();
Logger.reloadGlobalLevel('CRITICAL');
const logger2 = new LoggerDefault('name2', undefined, writable2);
Assert.equal(logger2.getLevel(), Logger.CRITICAL);
['debug', 'info', 'warning', 'error', 'critical'].forEach((name) => {
  Assert.equal(logger2[name](name), undefined);
});
Assert.equal(writable2.getContent(), 'CRITICAL name2 >> critical\n');
Logger.reloadGlobalLevel('ERROR');
Assert.equal(logger2.getLevel(), Logger.ERROR);
Logger.reloadGlobalLevel('FOO');
Assert.equal(logger2.getLevel(), Logger.ERROR);
