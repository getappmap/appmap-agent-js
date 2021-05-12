import { strict as Assert } from 'assert';
import {
  getDisabledRecorder,
  start,
  startSync,
} from '../../../../../lib/client/es2015/recorder.js';

(async () => {
  /////////////
  // Enabled //
  /////////////

  {
    const trace1 = [
      {
        action: 'start',
        session: 'session',
        configuration: 'configuration',
      },
      {
        action: 'pause',
        session: 'session',
        recording: 'recording',
      },
      {
        action: 'play',
        session: 'session',
        recording: 'recording',
      },
      {
        action: 'stop',
        session: 'session',
        recording: 'recording',
      },
    ];

    let trace2;

    const respond = (json) => {
      trace2.push(json);
      if (json.action === 'start') {
        return 'recording';
      }
      return null;
    };

    // Enabled - Sync //
    {
      trace2 = [];
      const recorder = startSync(
        {
          request: () => {
            Assert.fail();
          },
          requestSync: (...args) => {
            Assert.equal(args.length, 1);
            return respond(args[0]);
          },
        },
        'session',
        'configuration',
      );
      Assert.equal(recorder.isEnabled(), true);
      Assert.equal(recorder.pauseSync(), undefined);
      Assert.equal(recorder.playSync(), undefined);
      Assert.equal(recorder.stopSync(), undefined);
      Assert.deepEqual(trace2, trace1);
    }

    // Enabled - Async //
    {
      trace2 = [];
      const recorder = await start(
        {
          request: (...args) => {
            Assert.equal(args.length, 2);
            args[1].resolve(respond(args[0]));
          },
          requestSync: () => {
            Assert.fail();
          },
        },
        'session',
        'configuration',
      );
      Assert.equal(await recorder.pause(), undefined);
      Assert.equal(await recorder.play(), undefined);
      Assert.equal(await recorder.stop(), undefined);
      Assert.deepEqual(trace2, trace1);
    }
  }

  // Disabled - Sync //
  Assert.equal(getDisabledRecorder().isEnabled(), false);
  Assert.equal(getDisabledRecorder().pauseSync(), undefined);
  Assert.equal(getDisabledRecorder().playSync(), undefined);
  Assert.equal(getDisabledRecorder().stopSync(), undefined);

  // Disabled - Async //
  Assert.equal(await getDisabledRecorder().play(), undefined);
  Assert.equal(await getDisabledRecorder().pause(), undefined);
  Assert.equal(await getDisabledRecorder().stop(), undefined);
})();
