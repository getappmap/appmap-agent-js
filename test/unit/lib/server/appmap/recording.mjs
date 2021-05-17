import * as FileSystem from 'fs';
import { strict as Assert } from 'assert';
import { Recording } from '../../../../../lib/server/appmap/recording.mjs';
import { getInitialConfiguration } from '../../../../../lib/server/configuration/index.mjs';

const unlink = (path) => {
  try {
    FileSystem.unlinkSync(path);
  } catch (error) {
    Assert.equal(error.code, 'ENOENT');
  }
};

const identity = (any) => any;

{
  const origin1 = {
    path: '/base/foo/bar.js',
    entities: ['entity1'],
  };
  const origin2 = {
    path: '/base/foo/qux.js',
    entities: ['entity2'],
  };
  const recording = new Recording(
    getInitialConfiguration()
      .extendWithData(
        {
          'class-map-pruning': false,
          'event-pruning': false,
          base: {
            path: '/base',
          },
          output: {
            'directory-path': 'tmp/test/',
            'file-name': 'foo',
          },
        },
        process.cwd(),
      )
      .fromRight(),
  );
  recording.register(origin1);
  recording.record(origin1, 'event1');
  recording.toggle();
  recording.record(origin1, 'event2');
  recording.toggle();
  recording.record(origin2, 'event3');
  unlink('tmp/test/bar.appmap.json');
  recording.terminate((path) => {
    Assert.equal(path, `${process.cwd()}/tmp/test/foo`);
    return 'tmp/test/bar';
  });
  const appmap = JSON.parse(
    FileSystem.readFileSync('tmp/test/bar.appmap.json', 'utf8'),
  );
  Assert.deepEqual(appmap.classMap, [
    {
      type: 'package',
      name: 'foo',
      childeren: [
        {
          type: 'class',
          name: 'bar.js',
          childeren: ['entity1'],
        },
        {
          type: 'class',
          name: 'qux.js',
          childeren: ['entity2'],
        },
      ],
    },
  ]);
  Assert.deepEqual(appmap.events, ['event1', 'event3']);
}

{
  const origin1 = {
    path: '/foo.js',
    entities: ['entity1'],
  };
  const origin2 = {
    path: '/bar.js',
    entities: ['entity2'],
  };
  const recording = new Recording(
    getInitialConfiguration()
      .extendWithData(
        {
          'class-map-pruning': false,
          'event-pruning': true,
          output: {
            'directory-path': 'tmp/test/',
            'file-name': 'foo',
          },
        },
        process.cwd(),
      )
      .fromRight(),
  );
  recording.register(origin1);
  recording.record(origin1, 'event1');
  recording.record(origin2, 'event2');
  unlink('tmp/test/foo.appmap.json');
  recording.terminate(identity);
  const appmap = JSON.parse(
    FileSystem.readFileSync('tmp/test/foo.appmap.json', 'utf8'),
  );
  Assert.deepEqual(appmap.classMap, [
    {
      type: 'class',
      name: 'foo.js',
      childeren: ['entity1'],
    },
  ]);
  Assert.deepEqual(appmap.events, ['event1']);
}

{
  const recording = new Recording(
    getInitialConfiguration()
      .extendWithData(
        {
          output: {
            'directory-path': 'tmp/test/',
            'file-name': 'foo',
          },
        },
        process.cwd(),
      )
      .fromRight(),
  );
  recording.record(null, 'event');
  unlink('tmp/test/foo.appmap.json');
  recording.terminate(identity);
  const appmap = JSON.parse(
    FileSystem.readFileSync('tmp/test/foo.appmap.json', 'utf8'),
  );
  Assert.deepEqual(appmap.events, ['event']);
}

Assert.match(
  new Recording(
    getInitialConfiguration()
      .extendWithData(
        {
          output: {
            'directory-path': 'missing',
            'file-name': 'foo',
          },
        },
        process.cwd(),
      )
      .fromRight(),
  )
    .terminate(identity)
    .fromLeft(),
  /^failed to write appmap/,
);

new Recording(
  getInitialConfiguration()
    .extendWithData(
      {
        output: {
          'directory-path': 'missing',
          'file-name': 'foo',
        },
      },
      process.cwd(),
    )
    .fromRight(),
)
  .terminateAsync(identity)
  .then((either) => {
    Assert.match(either.fromLeft(), /^failed to write appmap/);
  });

new Recording(
  getInitialConfiguration()
    .extendWithData(
      {
        output: {
          'directory-path': 'tmp/test',
          'file-name': 'foo',
        },
      },
      process.cwd(),
    )
    .fromRight(),
)
  .terminateAsync(identity)
  .then((either) => {
    either.fromRight();
  });
