import {strict as Assert} from "assert";
import { test } from './__fixture__.mjs';
import '../../../../../lib/server/instrument/visit-identifier.mjs';

test({
  input: `$: 123;`,
  prefix: "$",
  keys: [['body', 0], 'label'],
});

test({
  input: `x;`,
  prefix: "$",
  keys: [['body', 0], 'expression'],
});

Assert.throws(
  () => test({
    input: `$;`,
    prefix: "$",
    keys: [['body', 0], 'expression'],
  }),
  (error) => error.getMessage().startsWith("identifier collision")
);
