const global_Promise = Promise;
const global_undefined = undefined;

const noop = () => {};

const resolveUndefined = (resolve, reject) => {
  resolve(global_undefined);
};

const makeNoopPromise = () => new global_Promise(resolveUndefined);

const makeRequestSync = (action) =>
  function requestSync() {
    this.channel.requestSync({
      action,
      session: this.session,
      recording: this.recording,
    });
  };

const makeRequest = (action) =>
  function request() {
    return new global_Promise((resolve, reject) => {
      this.channel.request(
        {
          action,
          session: this.session,
          recording: this.recording,
        },
        {
          resolve: (result) => {
            resolve(global_undefined);
          },
          reject,
        }
      );
    });
  };

const prototype = {
  isEnabled: () => true,
  play: makeRequest("play"),
  pause: makeRequest("pause"),
  stop: makeRequest("stop"),
  playSync: makeRequestSync("play"),
  pauseSync: makeRequestSync("pause"),
  stopSync: makeRequestSync("stop"),
};

const singleton = {
  isEnabled: () => false,
  play: makeNoopPromise,
  pause: makeNoopPromise,
  stop: makeNoopPromise,
  playSync: noop,
  pauseSync: noop,
  stopSync: noop,
};

exports.getDisabledRecorder = () => singleton;

exports.startSync = (channel, session, configuration) => ({
  __proto__: prototype,
  channel,
  session,
  recording: channel.requestSync({
    action: "start",
    session,
    configuration,
  }),
});

exports.start = (channel, session, configuration) =>
  new global_Promise((resolve, reject) => {
    channel.request(
      {
        action: "start",
        session,
        configuration,
      },
      {
        resolve: (recording) => {
          resolve({
            __proto__: prototype,
            channel,
            session,
            recording,
          });
        },
        reject,
      }
    );
  });
