import { strict as Assert } from 'assert';
import { hookThread } from '../../../../../lib/client/node/thread.js';

const trace = [];

const couple = {
  recordCall(...args) {
    Assert.equal(this, couple);
    trace.push('call', ...args);
  },
  recordReturn(...args) {
    Assert.equal(this, couple);
    trace.push('return', ...args);
  },
};

const makeCouple = () => couple;

const unhook = hookThread(makeCouple);
setImmediate(() => {}, 0);
unhook();

trace[1].child_thread_id = 123;
Assert.deepEqual(trace, [
  'call',
  {
    defined_class: 'EventLoop',
    method_id: 'jump',
    static: true,
    child_thread_id: 123,
    child_thread_type: 'Immediate',
  },
  'return',
  {},
]);
