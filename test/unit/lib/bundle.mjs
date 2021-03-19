import * as Vm from 'vm';
import { strict as Assert } from 'assert';
import Namespace from '../../../lib/namespace.mjs';
import bundle from '../../../lib/bundle.mjs';

Assert.ok(true);

const namespace = new Namespace('PREFIX');

bundle(namespace, {
  ecmascript: 3,
  channel: 'local',
  platform: 'node',
});

bundle(namespace, {
  ecmascript: 'foobar',
  channel: 'local',
  platform: 'node',
});

global.PREFIX_GLOBAL_APPMAP_OBJECT = {
  setEngine() {},
  archive() {},
  addEvent() {},
};

Vm.runInThisContext(
  bundle(namespace, {
    ecmascript: 2015,
    channel: 'local',
    platform: 'node',
  }),
);

Assert.equal(typeof PREFIX_GLOBAL_EVENT_COUNTER, 'number');
