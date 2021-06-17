const global_Promise = Promise;
const global_undefined = undefined;
const global_Reflect_apply = Reflect.apply;
const global_Promise_resolve = Promise.resolve;

const noop = () => {};

const makeNoopPromise = () =>
  global_Reflect_apply(global_Promise_resolve, global_Promise, [
    global_undefined,
  ]);

const makeRequest = (action) =>
  function request() {
    this.channel.request(
      {
        action,
        session: this.session,
        data: this.recording,
      },
      false
    );
  };

const makeRequestAsync = (action) =>
  function requestAsync() {
    return this.channel
      .requestAsync(
        {
          action,
          session: this.session,
          data: this.recording,
        },
        false
      )
      .then(noop);
  };

const prototype = {
  isEnabled: () => true,
  playAsync: makeRequestAsync("play"),
  pauseAsync: makeRequestAsync("pause"),
  stopAsync: makeRequestAsync("stop"),
  play: makeRequest("play"),
  pause: makeRequest("pause"),
  stop: makeRequest("stop"),
};

const singleton = {
  isEnabled: () => false,
  playAsync: makeNoopPromise,
  pauseAsync: makeNoopPromise,
  stopAsync: makeNoopPromise,
  play: noop,
  pause: noop,
  stop: noop,
};

exports.getDisabledRecording = () => singleton;

exports.makeRecording = (channel, session, configuration) => ({
  __proto__: prototype,
  channel,
  session,
  recording: channel.request(
    {
      action: "start",
      session,
      data: configuration,
    },
    false
  ),
});

exports.makeRecordingAsync = (channel, session, configuration) =>
  channel
    .requestAsync(
      {
        action: "start",
        session,
        data: configuration,
      },
      false
    )
    .then((recording) => ({
      __proto__: prototype,
      channel,
      session,
      recording,
    }));
