import * as VirtualMachine from 'vm';
import { strict as Assert } from 'assert';
import {
  makeAppmap,
  makeAppmapAsync,
} from '../../../../../lib/client/es2015/appmap.js';
import { getDisabledRecording } from '../../../../../lib/client/es2015/recording.js';

(async () => {
  //////////////
  // Enabled  //
  //////////////

  {
    let counter = 0;

    /* eslint-disable no-eval */
    const getRuntime = () => global.eval(`HIDDEN${String(counter)}`);
    /* eslint-enable no-eval */

    const makeTrace = () => [
      {
        action: 'initialize',
        session: null,
        data: 'appmap-configuration',
      },
      'hook-start',
      {
        action: 'start',
        session: `HIDDEN${String(counter)}`,
        data: 'configuration-recording',
      },
      {
        action: 'instrument',
        session: `HIDDEN${String(counter)}`,
        data: {
          source: 'source',
          path: 'path',
          content: 'content',
        },
      },
      {
        action: 'record',
        session: `HIDDEN${String(counter)}`,
        data: {
          origin: 'origin',
          event: 'event',
        },
      },
      {
        action: 'stop',
        session: `HIDDEN${String(counter)}`,
        data: 'recording',
      },
      {
        action: 'terminate',
        session: `HIDDEN${String(counter)}`,
        data: 'reason',
      },
      'hook-stop',
    ];

    let trace;

    let traps = null;

    const hook = (...args) => {
      Assert.equal(traps, null);
      Assert.equal(args.length, 1);
      trace.push('hook-start');
      traps = args[0];
      return (...args) => {
        Assert.notEqual(traps, null);
        Assert.equal(args.length, 0);
        trace.push('hook-stop');
        traps = null;
      };
    };

    const respond = (json) => {
      trace.push(json);
      if (json.action === 'initialize') {
        counter += 1;
        return {
          session: `HIDDEN${String(counter)}`,
          hooking: { esm: true, cjs: true },
        };
      }
      if (json.action === 'start') {
        return 'recording';
      }
      return null;
    };

    const run = (script) => VirtualMachine.runInThisContext(script);

    {
      trace = [];
      const appmap = makeAppmap(
        {
          request: (...args) => {
            Assert.equal(args.length, 1);
            return respond(args[0]);
          },
          requestAsync: (...args) => {
            Assert.equal(args.length, 2);
            Assert.equal(args[0].action, 'record');
            Assert.equal(args[1], true);
            respond(args[0]);
          },
        },
        hook,
        run,
        'appmap-configuration',
      );
      Assert.equal(appmap.isEnabled(), true);
      Assert.throws(
        () =>
          makeAppmap(
            {
              request: () => {
                Assert.fail();
              },
              requestAsync: () => {
                Assert.fail();
              },
            },
            hook,
            run,
            'appmap-configuration',
          ),
        /Error: Another appmap is already running/,
      );
      const recording = appmap.start('configuration-recording');
      Assert.equal(traps.cjs('source', 'path', 'content'), null);
      Assert.equal(getRuntime().record('origin', 'event'), undefined);
      Assert.equal(recording.stop(), undefined);
      Assert.equal(appmap.terminate('reason'), undefined);
      Assert.equal(getRuntime().record('origin', 'event'), undefined);
      Assert.deepEqual(trace, makeTrace());
    }

    {
      trace = [];
      const appmap = await makeAppmapAsync(
        {
          request: () => {
            Assert.fail();
          },
          requestAsync: (...args) => {
            Assert.equal(args.length, 2);
            Assert.equal(args[1], args[0].action === 'record');
            return Promise.resolve(respond(args[0]));
          },
        },
        hook,
        run,
        'appmap-configuration',
      );
      try {
        await makeAppmapAsync(
          {
            request: () => {
              Assert.fail();
            },
            requestAsync: () => {
              Assert.fail();
            },
          },
          hook,
          run,
          'appmap-configuration',
        );
        Assert.fail();
      } catch (error) {
        Assert.equal(error.message, 'Another appmap is already running');
      }
      const recording = await appmap.startAsync('configuration-recording');
      Assert.equal(await traps.esm('source', 'path', 'content'), null);
      Assert.equal(await getRuntime().record('origin', 'event'), null);
      Assert.equal(await recording.stopAsync(), undefined);
      Assert.equal(await appmap.terminateAsync('reason'), undefined);
      Assert.equal(getRuntime().record('origin', 'event'), undefined);
      Assert.deepEqual(trace, makeTrace());
    }
  }

  /////////////////////////////
  // Enabled >> Empty Hooking //
  /////////////////////////////

  {
    let trace = [];
    Assert.equal(
      await makeAppmap(
        {
          request: (...args) => {
            trace.push('request', args);
            return { session: 'foo', hooking: { cjs: false, esm: false } };
          },
          requestAsync: (...args) => {
            trace.push('request-async', args);
            return Promise.resolve(null);
          },
        },
        (...args) => {
          trace.push('hook-start', args);
          return (...args) => {
            trace.push('hook-stop', args);
          };
        },
        (script) => {
          trace.push('run');
          global.foo = {};
        },
        'appmap-configuration',
      ).terminateAsync('reason'),
      undefined,
    );
    Assert.deepEqual(trace, [
      'request',
      [
        {
          action: 'initialize',
          session: null,
          data: 'appmap-configuration',
        },
      ],
      'run',
      'hook-start',
      [{ cjs: null, esm: null }],
      'request-async',
      [{ action: 'terminate', session: 'foo', data: 'reason' }, false],
      'hook-stop',
      [],
    ]);
  }

  //////////////
  // Disabled //
  //////////////

  {
    const hook = () => {
      Assert.fail();
    };

    const run = () => {
      Assert.fail();
    };

    {
      const appmap = makeAppmap(
        {
          request: (...args) => {
            Assert.deepEqual(args, [
              {
                action: 'initialize',
                session: null,
                data: 'appmap-configuration',
              },
            ]);
            return null;
          },
          requestAsync: () => {
            Assert.fail();
          },
        },
        hook,
        run,
        'appmap-configuration',
      );
      Assert.equal(appmap.isEnabled(), false);
      Assert.equal(appmap.start(), getDisabledRecording());
      Assert.equal(appmap.terminate('reason'), undefined);
    }

    {
      const appmap = await makeAppmapAsync(
        {
          request: () => {
            Assert.fail();
          },
          requestAsync: (...args) => {
            Assert.deepEqual(args, [
              {
                action: 'initialize',
                session: null,
                data: 'appmap-configuration',
              },
              false,
            ]);
            return Promise.resolve(null);
          },
        },
        hook,
        run,
        'appmap-configuration',
      );
      Assert.equal(await appmap.startAsync(), getDisabledRecording());
      Assert.equal(await appmap.terminateAsync(), undefined);
    }
  }
})();
