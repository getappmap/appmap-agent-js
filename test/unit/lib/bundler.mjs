import * as Vm from 'vm';
import { strict as Assert } from 'assert';
import Namespace from '../../../lib/namespace.mjs';
import * as Bundler from '../../../lib/bundler.mjs';

Assert.ok(true);

const namespace = new Namespace('PREFIX');

Bundler.bundle(namespace, {
  ecmascript: 3,
  channel: 'local',
  platform: 'node',
});

Bundler.bundle(namespace, {
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
  Bundler.bundle(namespace, {
    ecmascript: 2015,
    channel: 'local',
    platform: 'node',
  }),
);

Assert.equal(typeof PREFIX_GLOBAL_EVENT_COUNTER, 'number');
