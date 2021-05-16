const {
  makeRecording,
  makeRecordingAsync,
  getDisabledRecording,
} = require("./recording.js");
const { getRuntime } = require("./runtime.js");

/* eslint-disable no-eval */
const global_eval = eval;
/* eslint-enable no-eval */
const global_Object_assign = Object.assign;
const global_Error = Error;
const global_undefined = undefined;
const global_Promise = Promise;
const global_Reflect_apply = Reflect.apply;
const global_Promise_resolve = Promise.resolve;
const global_Promise_reject = Promise.reject;

const PENDING = 0;

const noop = () => {};

let runtime = null;

const singleton = {
  runtime: { __proto__: null },
  isEnabled: () => false,
  cleanup: () => {
    // console.assert(runtime === singleton.runtime);
    runtime = null;
  },
  start: (configuration) => getDisabledRecording(),
  startAsync: (configuration) =>
    global_Reflect_apply(global_Promise_resolve, global_Promise, [
      getDisabledRecording(),
    ]),
  terminate: (reason) => {
    singleton.cleanup();
  },
  terminateAsync: (reason) =>
    global_Reflect_apply(global_Promise_resolve, global_Promise, [
      global_undefined,
    ]),
};

const prototype = {
  isEnabled: () => true,
  cleanup() {
    // console.assert(runtime === this.runtime);
    runtime.record = noop;
    runtime = null;
    this.unhook();
  },
  start(configuration) {
    return makeRecording(this.channel, this.session, configuration);
  },
  startAsync(configuration) {
    return makeRecordingAsync(this.channel, this.session, configuration);
  },
  terminate(reason) {
    this.channel.request({
      action: "terminate",
      session: this.session,
      data: reason,
    });
    this.cleanup();
  },
  terminateAsync(reason) {
    return this.channel
      .requestAsync(
        {
          action: "terminate",
          session: this.session,
          data: reason,
        },
        false
      )
      .then(() => {
        this.cleanup();
      });
  },
};

const make = (response, channel, hook, run) => {
  if (response === null) {
    runtime = singleton.runtime;
    return singleton;
  }

  const { session, hooking } = response;

  run(`'use strict'; let ${session} = {__proto__:null};`);

  runtime = global_eval(session);

  global_Object_assign(runtime, getRuntime());

  runtime.record = (origin, event) =>
    channel.requestAsync(
      { action: "record", session, data: { origin, event } },
      true
    );

  return {
    __proto__: prototype,
    runtime,
    channel,
    session,
    unhook: hook({
      cjs: hooking.cjs
        ? (source, path, content) =>
            channel.request({
              action: "instrument",
              session,
              data: {
                source,
                path,
                content,
              },
            })
        : null,
      esm: hooking.esm
        ? (source, path, content) =>
            channel.requestAsync(
              {
                action: "instrument",
                session,
                data: {
                  source,
                  path,
                  content,
                },
              },
              false
            )
        : null,
    }),
  };
};

exports.makeAppmapAsync = (channel, hook, run, data) => {
  if (runtime !== null) {
    return global_Reflect_apply(global_Promise_reject, global_Promise, [
      new global_Error("Another appmap is already running"),
    ]);
  }
  runtime = PENDING;
  return channel
    .requestAsync(
      {
        action: "initialize",
        session: null,
        data,
      },
      false
    )
    .then((response) => make(response, channel, hook, run));
};

exports.makeAppmap = (channel, hook, run, data) => {
  if (runtime !== null) {
    throw new global_Error("Another appmap is already running");
  }
  return make(
    channel.request({
      action: "initialize",
      session: null,
      data,
    }),
    channel,
    hook,
    run
  );
};
