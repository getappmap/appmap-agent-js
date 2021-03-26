import { strict as Assert } from 'assert';
import { load } from '../../__fixture__.mjs';

load('src/es2015/node/process-id.js');

Assert.equal(typeof APPMAP_GLOBAL_PROCESS_ID, "number");
