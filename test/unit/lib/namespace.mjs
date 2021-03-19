import { strict as Assert } from 'assert';
import Namespace from '../../../lib/namespace.mjs';

const namespace = new Namespace('PREFIX');

Assert.equal(namespace.checkIdentifierCollision('foo'), undefined);
Assert.equal(namespace.checkIdentifierCollision('PREFIXfoo'), undefined);

Assert.equal(
  namespace.compileGlobalIdentifier('APPMAP_GLOBAL_EVENT_COUNTER'),
  'PREFIX_GLOBAL_EVENT_COUNTER',
);
Assert.equal(
  namespace.compileGlobalIdentifier('APPMAP_GLOBAL_foo'),
  'PREFIX_GLOBAL_foo',
);
Assert.equal(namespace.compileGlobalIdentifier('foo'), 'foo');

Assert.equal(
  namespace.getGlobalIdentifier('EVENT_COUNTER'),
  'PREFIX_GLOBAL_EVENT_COUNTER',
);
Assert.equal(namespace.getGlobalIdentifier('foo'), 'PREFIX_GLOBAL_foo');

Assert.equal(
  namespace.getLocalIdentifier('EVENT_ID'),
  'PREFIX_LOCAL_EVENT_ID',
);
Assert.equal(namespace.getLocalIdentifier('foo'), 'PREFIX_LOCAL_foo');
