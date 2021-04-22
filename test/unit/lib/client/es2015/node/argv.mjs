import { strict as Assert } from 'assert';
import Argv from '../../../../../../lib/client/es2015/node/argv.js';

const resolve = (string) => string.toLowerCase();

// Match //

Assert.deepEqual(
  Argv.removeNamedArgument(['--foo', 'bar'], '--foo', 'BAR', resolve),
  [],
);

Assert.deepEqual(
  Argv.removeNamedArgument(['--foo=bar'], '--foo', 'BAR', resolve),
  [],
);

// Different Value //

Assert.deepEqual(
  Argv.removeNamedArgument(['--foo', 'bar'], '--foo', 'QUX', resolve),
  ['--foo', 'bar'],
);

Assert.deepEqual(
  Argv.removeNamedArgument(['--foo=bar'], '--qux', 'BAR', resolve),
  ['--foo=bar'],
);

// Different Key //

Assert.deepEqual(
  Argv.removeNamedArgument(['--foo', 'bar'], '--qux', 'BAR', resolve),
  ['--foo', 'bar'],
);

Assert.deepEqual(
  Argv.removeNamedArgument(['--foo=bar'], '--qux', 'BAR', resolve),
  ['--foo=bar'],
);

// Missing Value //

Assert.deepEqual(Argv.removeNamedArgument(['--foo'], '--foo', 'BAR', resolve), [
  '--foo',
]);
