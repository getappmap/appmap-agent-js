import { test } from './__fixture__.mjs';
import '../../../../lib/instrument/visit-program.mjs';

Error.stackTraceLimit = Infinity;

test({
  input: `123;`,
  keys: [],
});
