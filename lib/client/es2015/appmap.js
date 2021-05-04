
const {start, startSync, getDisabledRecorder} = require("./recorder.js");
const {getRuntime} = require("./runtime.js");

/* eslint-disable no-eval */
const global_eval = eval;
/* eslint-enable no-eval */
const global_Promise = Promise;
const global_Object_assign = Object.assign;
const global_Error = Error;
const global_undefined = undefined;

const PENDING = 0;

const noop = () => {};

let runtime = null;

const resolveDisabledRecorder = (resolve, reject) => resolve(getDisabledRecorder());

const resolveUndefined = (resolve, reject) => resolve(global_undefined);

const singleton = {
  runtime: {__proto__:null},
  isEnabled: () => false,
  cleanup: () => {
    // console.asset(runtime === singleton.runtime);
    runtime = null;
  },
  startSync: (configuration) => getDisabledRecorder(),
  start: (configuration) => new global_Promise(resolveDisabledRecorder),
  terminateSync: (reason) => {
    singleton.cleanup();
  },
  terminate: (reason) => new global_Promise(resolveUndefined)
};

const prototype = {
  isEnabled: () => true,
  cleanup () {
    // console.asset(runtime === this.runtime);
    runtime.record = noop;
    runtime = null;
    this.hook.stop();
  },
  startSync (configuration) {
    return startSync(this.channel, this.session, configuration);
  },
  start (configuration) {
    return start(this.channel, this.session, configuration);
  },
  terminateSync (reason) {
    this.channel.requestSync({
      action: "terminate",
      session: this.session,
      reason
    });
    this.cleanup();
  },
  terminate (reason) {
    return new global_Promise((resolve, reject) => {
      this.channel.request({
        action: "terminate",
        session: this.session,
        reason
      }, {
        resolve: () => {
          this.cleanup();
          resolve(global_undefined);
        },
        reject
      });
    });
  }
};

const make = ({enabled, session, namespace}, channel, hook, run) => {

  if (!enabled) {
    runtime = singleton.runtime;
    return singleton;
  }

  run(`'use strict'; let ${namespace} = {__proto__:null};`);

  runtime = global_eval(namespace);

  global_Object_assign(
    runtime,
    getRuntime()
  );

  runtime.record = (origin, event) => channel.request({action:"record", session, origin, event}, null);

  hook.start(
    (source, path, content, pending) => {
      if (pending === null) {
        return channel.requestSync({
          action: "instrument",
          session,
          source,
          path,
          content
        });
      }
      channel.request({
        action: "instrument",
        session,
        source,
        path,
        content
      }, pending);
      return null;
    }
  );

  return {
    __proto__: prototype,
    runtime,
    channel,
    session,
    hook
  };

};

exports.makeAppmap = (channel, hook, run, options) => new global_Promise((resolve, reject) => {
  if (runtime !== null) {
    reject(new global_Error('Another appmap is already running'));
  } else {
    runtime = PENDING;
    channel.request({
      action: "initialize",
      process: options.process,
      navigator: options.navigator,
      configuration: options.configuration
    }, {
      resolve: (result) => {
        // console.assert(runtime === PENDING);
        resolve(make(result, channel, hook, run));
      },
      reject
    });
  }
});

exports.makeAppmapSync = (channel, hook, run, options) => {
  if (runtime !== null) {
    throw new global_Error('Another appmap is already running');
  }
  return make(
    channel.requestSync({
      action: "initialize",
      process: options.process,
      navigator: options.navigator,
      configuration: options.configuration
    }),
    channel,
    hook,
    run
  );
};
