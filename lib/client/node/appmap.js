const {
  makeRecording,
  makeRecordingAsync,
  getDisabledRecording,
} = require("./recording.js");
const { getRuntime } = require("./runtime.js");
const { expect, assert } = require("./check.js");
const { run } = require("./run.js");
const { hook } = require("./hook/index.js");
const { makeChannel } = require("./channel/index.js");

/* eslint-disable no-eval */
const global_eval = eval;
/* eslint-enable no-eval */
const global_process = process;
const global_Object_assign = Object.assign;
const global_undefined = undefined;
const global_Promise = Promise;
const global_Reflect_apply = Reflect.apply;
const global_Promise_resolve = Promise.resolve;

const PENDING = 0;

const noop = () => {};

let runtime = null;

const singleton = {
  runtime: { __proto__: null },
  isEnabled: () => false,
  cleanup: () => {
    expect(
      runtime === singleton.runtime,
      "runtime mistmatch: %o !== %o",
      runtime,
      singleton.runtime
    );
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

const prototype1 = {
  isEnabled: () => true,
  cleanup() {
    assert(
      runtime === this.private.runtime,
      "runtime mistmatch: %o !== %o",
      runtime,
      this.private.runtime
    );
    runtime = null;
    this.private.runtime.record = noop;
    this.private.unhook();
  },
  start(configuration) {
    return makeRecording(
      this.private.channel,
      this.private.session,
      configuration
    );
  },
  startAsync(configuration) {
    return makeRecordingAsync(
      this.private.channel,
      this.private.session,
      configuration
    );
  },
  terminate(reason) {
    this.private.channel.request({
      action: "terminate",
      session: this.private.session,
      data: reason,
    });
    this.cleanup();
  },
  terminateAsync(reason) {
    return this.private.channel
      .requestAsync(
        {
          action: "terminate",
          session: this.private.session,
          data: reason,
        },
        false
      )
      .then(() => {
        this.cleanup();
      });
  },
};

const finalize = (response, channel) => {
  if (response === null) {
    runtime = singleton.runtime;
    return singleton;
  }

  const { session, hooks } = response;

  run(`'use strict'; let ${session} = {__proto__:null};`);

  runtime = global_eval(session);

  global_Object_assign(runtime, getRuntime());

  const record = (origin, event) =>
    channel.requestAsync(
      { action: "record", session, data: { origin, event } },
      true
    );

  const instrument = (source, path, content) =>
    channel.request({
      action: "instrument",
      session,
      data: {
        source,
        path,
        content,
      },
    });

  const instrumentAsync = (source, path, content) =>
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
    );

  runtime.record = record;

  runtime.pid = global_process.pid;

  const prototype2 = {
    recordCall(object) {
      assert(
        this.id === null && this.timestamp !== null,
        "invalid state for recordCall"
      );
      this.id = runtime.event += 1;
      record(
        null,
        global_Object_assign(
          {
            id: this.id,
            event: "call",
            thread_id: runtime.pid,
          },
          object
        )
      );
    },
    recordReturn(object) {
      assert(
        this.id !== null && this.timestamp !== null,
        "invalid state for recordReturn"
      );
      record(
        null,
        global_Object_assign(
          {
            id: (runtime.event += 1),
            event: "return",
            thread_id: runtime.pid,
            parent_id: this.id,
            elapsed: runtime.getNow() - this.timestamp,
          },
          object
        )
      );
      this.timestamp = null;
    },
  };

  return {
    __proto__: prototype1,
    private: {
      runtime,
      channel,
      session,
      unhook: hook(hooks, {
        instrumentScript: (path, content) =>
          instrument("script", path, content),
        instrumentModuleAsync: (path, content) =>
          instrumentAsync("module", path, content),
        makeCouple: () => ({
          __proto__: prototype2,
          timestamp: runtime.getNow(),
          id: null,
        }),
      }),
    },
  };
};

const prepare = (options) => {
  expect(runtime === null, "another appmap is already running");
  options = global_Object_assign(
    {
      protocol: "inline",
      port: 0,
      host: "localhost",
      configuration: { data: {}, path: "/" },
    },
    options
  );
  return {
    channel: makeChannel(options.protocol, options.host, options.port),
    query: {
      action: "initialize",
      session: null,
      data: options.configuration,
    },
  };
};

exports.makeAppmapAsync = (options) => {
  const { channel, query } = prepare(options);
  runtime = PENDING;
  return channel
    .requestAsync(query, false)
    .then((response) => finalize(response, channel));
};

exports.makeAppmap = (options) => {
  const { channel, query } = prepare(options);
  return finalize(channel.request(query), channel);
};
