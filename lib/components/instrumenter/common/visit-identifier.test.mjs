import { strict as Assert } from 'assert';
import { test } from './__fixture__.mjs';
import '../../../../../lib/server/instrument/visit-identifier.mjs';

test({
  input: `$: 123;`,
  session: '$',
  keys: [['body', 0], 'label'],
});

test({
  input: `x;`,
  session: '$',
  keys: [['body', 0], 'expression'],
});

Assert.throws(
  () =>
    test({
      input: `$;`,
      session: '$',
      keys: [['body', 0], 'expression'],
    }),
  (error) => error.getMessage().startsWith('identifier collision'),
);
