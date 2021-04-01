import { test } from './__fixture__.mjs';
import '../../../../../lib/server/instrument/visit-identifier.mjs';

Error.stackTraceLimit = Infinity;

test({
  input: `l: 123;`,
  keys: [['body', 0], 'label'],
});

test({
  input: `x;`,
  keys: [['body', 0], 'expression'],
});
