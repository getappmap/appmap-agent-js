import { strict as Assert } from 'assert';
import Namespace from '../../../../lib/server/namespace.mjs';

const namespace = new Namespace('PREFIX');

Assert.equal(namespace.checkCollision('foo'), undefined);
Assert.equal(namespace.checkCollision('PREFIXfoo'), undefined);

Assert.equal(
  namespace.compileGlobal('APPMAP_GLOBAL_EVENT_COUNTER'),
  'PREFIX_GLOBAL_EVENT_COUNTER',
);
Assert.equal(namespace.compileGlobal('APPMAP_GLOBAL_foo'), 'PREFIX_GLOBAL_foo');
Assert.equal(namespace.compileGlobal('foo'), 'foo');

Assert.equal(
  namespace.getGlobal('EVENT_COUNTER'),
  'PREFIX_GLOBAL_EVENT_COUNTER',
);
Assert.equal(namespace.getGlobal('foo'), 'PREFIX_GLOBAL_foo');

Assert.equal(namespace.getLocal('EVENT_ID'), 'PREFIX_LOCAL_EVENT_ID');
Assert.equal(namespace.getLocal('foo'), 'PREFIX_LOCAL_foo');
