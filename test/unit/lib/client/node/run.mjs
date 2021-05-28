import { strict as Assert } from 'assert';
import { run } from '../../../../../lib/client/node/run.js';

Assert.equal(run('123;'), 123);
