import { strict as Assert } from 'assert';
import { run } from '../../../../../../lib/client/es2015/node12x/run.js';

Assert.equal(run('123;'), 123);
