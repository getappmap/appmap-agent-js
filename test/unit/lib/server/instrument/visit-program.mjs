import { test } from './__fixture__.mjs';
import '../../../../../lib/server/instrument/visit-program.mjs';

Error.stackTraceLimit = Infinity;

test({
  input: `123;`,
  keys: [],
});