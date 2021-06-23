import { strict as Assert } from 'assert';
import { hookThread } from '../../../../../lib/client/node/thread.js';

const trace = [];

const { disable, getCurrentThreadId } = hookThread((...args) =>
  trace.push(args),
);
const id1 = getCurrentThreadId();
setImmediate(() => {
  const id2 = getCurrentThreadId();
  Assert.notEqual(id1, id2);
  // Assert.deepEqual(trace, []);
  disable();
  setImmediate(() => {
    Assert.equal(trace.length, 1);
    Assert.equal(trace[0][2], 'Immediate');
  });
});

// Assert.deepEqual(trace, []);

// trace[1].child_thread_id = 123;
// Assert.deepEqual(trace, [
//   'call',
//   {
//     defined_class: 'EventLoop',
//     method_id: 'jump',
//     static: true,
//     child_thread_id: 123,
//     child_thread_type: 'Immediate',
//   },
//   'return',
//   {},
// ]);
