import * as FileSystem from 'fs';
import { strict as Assert } from 'assert';
import { Right } from '../../../../../lib/server/either.mjs';
import {
  setSpawnForTesting,
  normalizeChild,
  spawnNormalizedChild,
} from '../../../../../lib/server/configuration/child.mjs';

{
  const childeren = normalizeChild('node /main.js');
  Assert.deepEqual(childeren, childeren.flatMap(normalizeChild));
  Assert.deepEqual(childeren, normalizeChild('node /main.js'));
  Assert.deepEqual(
    childeren,
    normalizeChild({
      type: 'spawn',
      exec: 'node',
      argv: ['/main.js'],
    }),
  );
  Assert.deepEqual(
    childeren,
    normalizeChild({
      type: 'fork',
      globbing: false,
      main: '/main.js',
    }),
  );
}

Assert.equal(
  normalizeChild({
    type: 'fork',
    main: '*',
  }).map(({ argv }) => argv[0]).length,
  FileSystem.readdirSync('.').filter(
    (name) =>
      !name.startsWith('.') && !FileSystem.lstatSync(name).isDirectory(),
  ).length,
);

const child = normalizeChild(['node', '/main.js'])[0];

const mock = {
  protocol: 'inline',
  port: 0,
  host: 'localhost',
  data: 123,
  getProtocol(...args) {
    Assert.equal(this, mock);
    Assert.deepEqual(args, []);
    return this.protocol;
  },
  getHost(...args) {
    Assert.notEqual(this.protocol, 'inline');
    Assert.equal(this, mock);
    Assert.deepEqual(args, []);
    return this.host;
  },
  getPort(...args) {
    Assert.notEqual(this.protocol, 'inline');
    Assert.equal(this, mock);
    Assert.deepEqual(args, []);
    return this.port;
  },
  extendWithData(...args) {
    Assert.equal(this.protocol, 'inline');
    Assert.equal(this, mock);
    Assert.deepEqual(args, [{}, process.cwd()]);
    return new Right({ data: this.data });
  },
};

mock.protocol = 'inline';
mock.port = null;
setSpawnForTesting(() => 'foo');
Assert.equal(spawnNormalizedChild(child, mock).fromRight(), 'foo');

mock.protocol = 'messaging';
mock.port = 8080;
setSpawnForTesting(() => 'foo');
Assert.equal(spawnNormalizedChild(child, mock).fromRight(), 'foo');

mock.protocol = 'messaging';
mock.port = 'unix-posix-socket';
setSpawnForTesting(() => 'foo');
Assert.equal(spawnNormalizedChild(child, mock).fromRight(), 'foo');

process.env.NODE_OPTIONS = 'foo';
mock.protocol = 'messaging';
mock.port = 8080;
setSpawnForTesting(() => {
  throw new Error('foo');
});
Assert.match(spawnNormalizedChild(child, mock).fromLeft(), /foo$/);
