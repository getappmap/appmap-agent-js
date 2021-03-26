import { test } from './__fixture__.mjs';
import '../../../../lib/instrument/visit-pattern.mjs';

Error.stackTraceLimit = Infinity;

const testPattern = (code) =>
  test({
    input: `[${code}] = 123;`,
    keys: [['body', 0], 'expression', 'left', ['elements', 0]],
  });

testPattern(`...x`);

testPattern(`{x, [y]:z, ...t}`);

testPattern(`[x,,...y]`);

testPattern(`x = y`);
