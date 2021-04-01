import { test } from './__fixture__.mjs';
import '../../../../lib/instrument/visit-class.mjs';

Error.stackTraceLimit = Infinity;

test({
  input: `(class { m () { } });`,
  keys: [['body', 0], 'expression'],
});

test({
  input: `class f extends null { static get [m] () { } } `,
  keys: [['body', 0]],
});
