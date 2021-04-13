import { strict as Assert } from 'assert';
import Namespace from '../../../../lib/server/namespace.mjs';

Assert.throws(() => new Namespace('FOO BAR'));

const namespace = new Namespace('PREFIX');

Assert.equal(namespace.checkCollision('foo'), undefined);
Assert.throws(() => namespace.checkCollision('PREFIXfoo'));

Assert.equal(
  namespace.getGlobal('EVENT_COUNTER'),
  'PREFIX_GLOBAL_EVENT_COUNTER',
);
Assert.throws(() => namespace.getGlobal('foo'));

Assert.equal(namespace.getLocal('EVENT_ID'), 'PREFIX_LOCAL_EVENT_ID');
Assert.throws(() => namespace.getLocal('foo'));
