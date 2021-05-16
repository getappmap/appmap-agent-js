import { strict as Assert } from 'assert';
import {
  getDisabledRecording,
  makeRecording,
  makeRecordingAsync,
} from '../../../../../lib/client/es2015/recording.js';

(async () => {
  /////////////
  // Enabled //
  /////////////

  {
    const trace1 = [
      {
        action: 'start',
        session: 'session',
        data: 'configuration',
      },
      {
        action: 'pause',
        session: 'session',
        data: 'recording',
      },
      {
        action: 'play',
        session: 'session',
        data: 'recording',
      },
      {
        action: 'stop',
        session: 'session',
        data: 'recording',
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
      const recorder = makeRecording(
        {
          requestAsync: () => {
            Assert.fail();
          },
          request: (...args) => {
            Assert.equal(args.length, 1);
            return respond(args[0]);
          },
        },
        'session',
        'configuration',
      );
      Assert.equal(recorder.isEnabled(), true);
      Assert.equal(recorder.pause(), undefined);
      Assert.equal(recorder.play(), undefined);
      Assert.equal(recorder.stop(), undefined);
      Assert.deepEqual(trace2, trace1);
    }

    // Enabled - Async //
    {
      trace2 = [];
      const recorder = await makeRecordingAsync(
        {
          requestAsync: (...args) => {
            Assert.equal(args.length, 2);
            return Promise.resolve(respond(args[0]));
          },
          request: () => {
            Assert.fail();
          },
        },
        'session',
        'configuration',
      );
      Assert.equal(await recorder.pauseAsync(), undefined);
      Assert.equal(await recorder.playAsync(), undefined);
      Assert.equal(await recorder.stopAsync(), undefined);
      Assert.deepEqual(trace2, trace1);
    }
  }

  // Disabled - Sync //
  Assert.equal(getDisabledRecording().isEnabled(), false);
  Assert.equal(getDisabledRecording().pause(), undefined);
  Assert.equal(getDisabledRecording().play(), undefined);
  Assert.equal(getDisabledRecording().stop(), undefined);

  // Disabled - Async //
  Assert.equal(await getDisabledRecording().playAsync(), undefined);
  Assert.equal(await getDisabledRecording().pauseAsync(), undefined);
  Assert.equal(await getDisabledRecording().stopAsync(), undefined);
})();
