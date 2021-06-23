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

const event1 = {
  thread_id: 0,
  event: 'call',
  id: 1,
};

const event2 = {
  thread_id: 0,
  event: 'return',
  id: 2,
  parent_id: 1,
};

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
      .extendWithData({
        cwd: process.cwd(),
        'class-map-pruning': false,
        'event-pruning': false,
        base: '/base',
        output: {
          directory: 'tmp/test/',
          'file-name': 'foo',
        },
      })
      .fromRight(),
  );
  recording.register(origin1);
  recording.record(origin1, event1);
  recording.toggle(false).fromRight();
  recording.record(origin1, 'invalid-event');
  recording.toggle(true).fromRight();
  recording.toggle(true).fromLeft();
  recording.record(origin2, event2);
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
      children: [
        {
          type: 'package',
          name: 'bar.js',
          children: ['entity1'],
        },
        {
          type: 'package',
          name: 'qux.js',
          children: ['entity2'],
        },
      ],
    },
  ]);
  Assert.deepEqual(appmap.events, [event1, event2]);
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
      .extendWithData({
        base: '/',
        cwd: process.cwd(),
        'class-map-pruning': false,
        'event-pruning': true,
        output: {
          directory: 'tmp/test/',
          'file-name': 'foo',
        },
      })
      .fromRight(),
  );
  recording.register(origin1);
  recording.record(origin1, event1);
  recording.record(origin1, event2);
  recording.record(origin2, 'invalid-event');
  unlink('tmp/test/foo.appmap.json');
  recording.terminate(identity);
  const appmap = JSON.parse(
    FileSystem.readFileSync('tmp/test/foo.appmap.json', 'utf8'),
  );
  Assert.deepEqual(appmap.classMap, [
    {
      type: 'package',
      name: 'foo.js',
      children: ['entity1'],
    },
  ]);
  Assert.deepEqual(appmap.events, [event1, event2]);
}

// Null Origin //
{
  const recording = new Recording(
    getInitialConfiguration()
      .extendWithData({
        cwd: process.cwd(),
        output: {
          directory: 'tmp/test/',
          'file-name': 'foo',
        },
      })
      .fromRight(),
  );
  recording.record(null, {
    thread_id: 0,
    event: 'call',
    id: 1,
  });
  recording.record(null, {
    thread_id: 0,
    event: 'return',
    id: 2,
    parent_id: 1,
  });
  unlink('tmp/test/foo.appmap.json');
  recording.terminate(identity);
  const appmap = JSON.parse(
    FileSystem.readFileSync('tmp/test/foo.appmap.json', 'utf8'),
  );
  Assert.deepEqual(appmap.events.length, 2);
}

Assert.match(
  new Recording(
    getInitialConfiguration()
      .extendWithData({
        cwd: process.cwd(),
        output: {
          directory: 'missing',
          'file-name': 'foo',
        },
      })
      .fromRight(),
  )
    .terminate(identity)
    .fromLeft(),
  /^failed to write appmap/,
);

new Recording(
  getInitialConfiguration()
    .extendWithData({
      cwd: process.cwd(),
      output: {
        directory: 'missing',
        'file-name': 'foo',
      },
    })
    .fromRight(),
)
  .terminateAsync(identity)
  .then((either) => {
    Assert.match(either.fromLeft(), /^failed to write appmap/);
  });

new Recording(
  getInitialConfiguration()
    .extendWithData({
      cwd: process.cwd(),
      output: {
        directory: 'tmp/test',
        'file-name': 'foo',
      },
    })
    .fromRight(),
)
  .terminateAsync(identity)
  .then((either) => {
    either.fromRight();
  });

//////////////////////
// manufactureStack //
//////////////////////

// manual jump //

{
  const recording = new Recording(
    getInitialConfiguration()
      .extendWithData({
        cwd: process.cwd(),
        output: {
          directory: 'tmp/test/',
          'file-name': 'foo',
        },
      })
      .fromRight(),
  );
  [
    {
      thread_id: 0,
      event: 'call',
      sql_query: null,
      id: 1,
    },
    {
      thread_id: 0,
      event: 'call',
      sql_query: null,
      id: 2,
    },
    {
      thread_id: 0,
      event: 'return',
      id: 3,
      parent_id: 1,
    },
    {
      thread_id: 1,
      event: 'return',
      id: 4,
      parent_id: 2,
    },
    {
      thread_id: 1,
      event: 'call',
      id: 5,
    },
    {
      thread_id: 1,
      event: 'return',
      id: 6,
      parent_id: 5,
    },
  ].forEach((event) => {
    recording.record(null, event);
  });
  unlink('tmp/test/foo.appmap.json');
  recording.terminate(identity);
  const appmap = JSON.parse(
    FileSystem.readFileSync('tmp/test/foo.appmap.json', 'utf8'),
  );
  Assert.deepEqual(appmap.events, [
    {
      thread_id: 0,
      event: 'call',
      sql_query: null,
      id: 1,
    },
    {
      thread_id: 0,
      event: 'call',
      sql_query: null,
      id: 2,
    },
    {
      thread_id: 0,
      event: 'return',
      id: 4,
      parent_id: 2,
    },
    {
      thread_id: 0,
      event: 'call',
      id: 5,
    },
    {
      thread_id: 0,
      event: 'return',
      id: 6,
      parent_id: 5,
    },
    {
      thread_id: 0,
      event: 'return',
      id: 3,
      parent_id: 1,
    },
  ]);
}

// // automatic jump //
//
// {
//   const recording = new Recording(
//     getInitialConfiguration()
//       .extendWithData({
//         cwd: process.cwd(),
//         output: {
//           directory: 'tmp/test/',
//           'file-name': 'foo',
//         },
//       })
//       .fromRight(),
//   );
//   [
//     {
//       thread_id: 0,
//       event: 'call',
//       id: 1,
//     },
//     {
//       thread_id: 0,
//       event: 'call',
//       id: 2,
//       child_thread_id: 1,
//     },
//     {
//       thread_id: 0,
//       event: 'return',
//       id: 3,
//       parent_id: 2,
//     },
//     {
//       thread_id: 0,
//       event: 'return',
//       id: 4,
//       parent_id: 1,
//     },
//     {
//       thread_id: 1,
//       event: 'call',
//       id: 5,
//     },
//     {
//       thread_id: 1,
//       event: 'return',
//       id: 6,
//       parent_id: 5,
//     },
//   ].forEach((event) => {
//     recording.record(null, event);
//   });
//   unlink('tmp/test/foo.appmap.json');
//   recording.terminate(identity);
//   const appmap = JSON.parse(
//     FileSystem.readFileSync('tmp/test/foo.appmap.json', 'utf8'),
//   );
//   Assert.deepEqual(appmap.events, [
//     {
//       thread_id: 0,
//       event: 'call',
//       id: 1,
//     },
//     {
//       thread_id: 0,
//       event: 'call',
//       id: 2,
//       child_thread_id: 1,
//     },
//     {
//       thread_id: 0,
//       event: 'call',
//       id: 5,
//     },
//     {
//       thread_id: 0,
//       event: 'return',
//       id: 6,
//       parent_id: 5,
//     },
//     {
//       thread_id: 0,
//       event: 'return',
//       id: 3,
//       parent_id: 2,
//     },
//     {
//       thread_id: 0,
//       event: 'return',
//       id: 4,
//       parent_id: 1,
//     },
//   ]);
// }
//
// // empty automatic jump //
//
// {
//   const recording = new Recording(
//     getInitialConfiguration()
//       .extendWithData({
//         cwd: process.cwd(),
//         output: {
//           directory: 'tmp/test/',
//           'file-name': 'foo',
//         },
//       })
//       .fromRight(),
//   );
//   [
//     {
//       thread_id: 0,
//       event: 'call',
//       id: 1,
//       child_thread_id: 1,
//     },
//     {
//       thread_id: 0,
//       event: 'return',
//       id: 2,
//       parent_id: 1,
//     },
//   ].forEach((event) => {
//     recording.record(null, event);
//   });
//   unlink('tmp/test/foo.appmap.json');
//   recording.terminate(identity);
//   const appmap = JSON.parse(
//     FileSystem.readFileSync('tmp/test/foo.appmap.json', 'utf8'),
//   );
//   Assert.deepEqual(appmap.events, []);
// }

// missing manual return jump //

{
  const recording = new Recording(
    getInitialConfiguration()
      .extendWithData({
        cwd: process.cwd(),
        output: {
          directory: 'tmp/test/',
          'file-name': 'foo',
        },
      })
      .fromRight(),
  );
  [
    {
      thread_id: 0,
      event: 'call',
      id: 1,
    },
    {
      thread_id: 0,
      event: 'call',
      sql_query: null,
      id: 2,
    },
    {
      thread_id: 0,
      event: 'return',
      id: 3,
      parent_id: 1,
    },
  ].forEach((event) => {
    recording.record(null, event);
  });
  unlink('tmp/test/foo.appmap.json');
  recording.terminate(identity);
  const appmap = JSON.parse(
    FileSystem.readFileSync('tmp/test/foo.appmap.json', 'utf8'),
  );
  Assert.deepEqual(appmap.events, [
    {
      thread_id: 0,
      event: 'call',
      id: 1,
    },
    {
      thread_id: 0,
      event: 'call',
      sql_query: null,
      id: 2,
    },
    {
      thread_id: 0,
      event: 'return',
      id: 4,
      parent_id: 2,
    },
    {
      thread_id: 0,
      event: 'return',
      id: 3,
      parent_id: 1,
    },
  ]);
}

// missing final jumps //

{
  const recording = new Recording(
    getInitialConfiguration()
      .extendWithData({
        cwd: process.cwd(),
        output: {
          directory: 'tmp/test/',
          'file-name': 'foo',
        },
      })
      .fromRight(),
  );
  [
    {
      thread_id: 0,
      event: 'call',
      http_server_request: null,
      id: 1,
    },
    {
      thread_id: 0,
      event: 'call',
      http_client_request: null,
      id: 2,
    },
  ].forEach((event) => {
    recording.record(null, event);
  });
  unlink('tmp/test/foo.appmap.json');
  recording.terminate(identity);
  const appmap = JSON.parse(
    FileSystem.readFileSync('tmp/test/foo.appmap.json', 'utf8'),
  );
  Assert.deepEqual(appmap.events, [
    {
      thread_id: 0,
      event: 'call',
      http_server_request: null,
      id: 1,
    },
    {
      thread_id: 0,
      event: 'call',
      http_client_request: null,
      id: 2,
    },
    {
      thread_id: 0,
      event: 'return',
      http_client_response: { status_code: 100 },
      id: 3,
      parent_id: 2,
    },
    {
      thread_id: 0,
      event: 'return',
      http_server_response: { status_code: 100 },
      id: 4,
      parent_id: 1,
    },
  ]);
}
