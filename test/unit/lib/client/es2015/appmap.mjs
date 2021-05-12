import * as VirtualMachine from 'vm';
import { strict as Assert } from 'assert';
import {
  makeAppmap,
  makeAppmapSync,
} from '../../../../../lib/client/es2015/appmap.js';
import { getDisabledRecorder } from '../../../../../lib/client/es2015/recorder.js';

(async () => {
  const options = {
    process: 'process',
    navigator: 'navigator',
    configuration: 'configuration',
  };

  /////////////
  // Enabled //
  /////////////

  {
    let counter = 0;

    /* eslint-disable no-eval */
    const getRuntime = () => global.eval(`HIDDEN${String(counter)}`);
    /* eslint-enable no-eval */

    const trace1 = [
      {
        action: 'initialize',
        process: 'process',
        navigator: 'navigator',
        configuration: 'configuration',
      },
      'hook-start',
      {
        action: 'start',
        session: 'session',
        configuration: 'configuration-recording',
      },
      {
        action: 'instrument',
        session: 'session',
        source: 'source',
        path: 'path',
        content: 'content',
      },
      {
        action: 'record',
        session: 'session',
        origin: 'origin',
        event: 'event',
      },
      {
        action: 'stop',
        session: 'session',
        recording: 'recording',
      },
      {
        action: 'terminate',
        session: 'session',
        reason: 'reason',
      },
      'hook-stop',
    ];

    let trace2;

    const hook = {
      instrument: null,
      start(...args) {
        Assert.equal(this, hook);
        Assert.equal(args.length, 1);
        trace2.push('hook-start');
        this.instrument = args[0];
      },
      stop(...args) {
        Assert.equal(this, hook);
        Assert.equal(args.length, 0);
        trace2.push('hook-stop');
      },
    };

    const respond = (json) => {
      trace2.push(json);
      if (json.action === 'initialize') {
        counter += 1;
        return {
          enabled: true,
          session: 'session',
          namespace: `HIDDEN${String(counter)}`,
        };
      }
      if (json.action === 'start') {
        return 'recording';
      }
      return null;
    };

    const run = (script) => VirtualMachine.runInThisContext(script);

    {
      trace2 = [];
      hook.instrument = null;
      const appmap = makeAppmapSync(
        {
          requestSync: (...args) => {
            Assert.equal(args.length, 1);
            return respond(args[0]);
          },
          request: (...args) => {
            Assert.equal(args.length, 2);
            Assert.equal(args[1], null);
            Assert.equal(args[0].action, 'record');
            respond(args[0]);
          },
        },
        hook,
        run,
        options,
      );
      Assert.equal(appmap.isEnabled(), true);
      Assert.throws(
        () =>
          makeAppmapSync(
            {
              requestSync: () => {
                Assert.fail();
              },
              request: () => {
                Assert.fail();
              },
            },
            hook,
            run,
            options,
          ),
        /Error: Another appmap is already running/,
      );
      const recording = appmap.startSync('configuration-recording');
      Assert.equal(hook.instrument('source', 'path', 'content', null), null);
      Assert.equal(getRuntime().record('origin', 'event'), undefined);
      Assert.equal(recording.stopSync(), undefined);
      Assert.equal(appmap.terminateSync('reason'), undefined);
      Assert.equal(getRuntime().record('origin', 'event'), undefined);
      Assert.deepEqual(trace2, trace1);
    }

    {
      trace2 = [];
      hook.instrument = null;
      const appmap = await makeAppmap(
        {
          requestSync: () => {
            Assert.fail();
          },
          request: (...args) => {
            Assert.equal(args.length, 2);
            const result = respond(args[0]);
            if (args[1] !== null) {
              args[1].resolve(result);
            }
          },
        },
        hook,
        run,
        options,
      );
      try {
        await makeAppmap(
          {
            requestSync: () => {
              Assert.fail();
            },
            request: () => {
              Assert.fail();
            },
          },
          hook,
          run,
          {},
        );
        Assert.fail();
      } catch (error) {
        Assert.equal(error.message, 'Another appmap is already running');
      }
      const recording = await appmap.start('configuration-recording');
      Assert.equal(
        await new Promise((resolve, reject) => {
          hook.instrument('source', 'path', 'content', { resolve, reject });
        }),
        null,
      );
      Assert.equal(getRuntime().record('origin', 'event'), undefined);
      Assert.equal(await recording.stop(), undefined);
      Assert.equal(await appmap.terminate('reason'), undefined);
      Assert.equal(getRuntime().record('origin', 'event'), undefined);
      Assert.deepEqual(trace2, trace1);
    }
  }

  //////////////
  // Disabled //
  //////////////

  {
    const hook = {
      start: () => {
        Assert.fail();
      },
      stop: () => {
        Assert.fail();
      },
    };

    const run = () => {
      Assert.fail();
    };

    {
      const appmap = makeAppmapSync(
        {
          requestSync: (...args) => {
            Assert.deepEqual(args, [
              {
                action: 'initialize',
                ...options,
              },
            ]);
            return { enabled: false, session: null, namespace: null };
          },
          requestAsync: () => {
            Assert.fail();
          },
        },
        hook,
        run,
        options,
      );
      Assert.equal(appmap.isEnabled(), false);
      Assert.equal(appmap.startSync(), getDisabledRecorder());
      Assert.equal(appmap.terminateSync('reason'), undefined);
    }

    {
      const appmap = await makeAppmap(
        {
          requestSync: () => {
            Assert.fail();
          },
          request: (...args) => {
            Assert.equal(args.length, 2);
            Assert.deepEqual(args[0], {
              action: 'initialize',
              ...options,
            });
            return args[1].resolve({
              enabled: false,
              session: null,
              namespace: null,
            });
          },
        },
        hook,
        run,
        options,
      );
      Assert.equal(await appmap.start(), getDisabledRecorder());
      Assert.equal(await appmap.terminate(), undefined);
    }
  }
})();
