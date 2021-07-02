const {
  makeRecording,
  makeRecordingAsync,
  getDisabledRecording,
} = require("./recording.js");
const { Recorder, getNoopRecorder } = require("./recorder.js");
const { getRuntime } = require("./runtime.js");
const { expect, assert } = require("./check.js");
const { run } = require("./run.js");

/* eslint-disable no-eval */
const global_eval = eval;
/* eslint-enable no-eval */
const global_Object_assign = Object.assign;
const global_undefined = undefined;

const PENDING = 0;

const noop = () => {};

let runtime = null;

const cleanup = (appmap) => {
  assert(
    runtime === this.private.runtime,
    "runtime mistmatch: %o !== %o",
    runtime,
    this.private.runtime
  );
  this.private.runtime.record = noop;
  this.private.unhook();
  this.private.unhookThread();
  runtime = null;
}


export default = ({client, platform, instrumenter}, options) => {

};

let counter = 0;

const Appmap = class {

  constructor (options, session) {

    assert(runtime === null, "appmap factories should have prevented concurrent instantiation");
    const hidden = `${options["escape-identifier"]}${String(counter += 1)}`;
    expect(global_eval(`typeof ${hidden}`) === global_undefined, "the runtime global variable %o has already been defined", hidden);
    run(`'use strict'; let ${hidden} = {__proto__:null};`);
    runtime = global_eval(hidden);
    global_Object_assign(runtime, getRuntime());

    const common = {
      counter: 0,
      session,
      getCurrentThreadId: null,
    };

    const {
      getCurrentThreadId,
      stopThread
    } = startThreading((type, id, parent_id) => {
      Record.recorThread(common, {type, id, parent_id});
    });

    common.getCurrentThreadId = getCurrentThreadId;

    runtime.makeRecorder = (origin) => new Recorder(origin, common);

    const makeRecorder = () => new Recorder(null, common);

    return {
      __proto__: prototype1,
      private: {
        unhookThread: hookThread(makeCouple),
        runtime,
        channel,
        session,
        unhook: hook(hooks, {
          instrumentScript: (path, content) =>
            instrument("script", path, content),
          instrumentModuleAsync: (path, content) =>
            instrumentAsync("module", path, content),
          makeRecord,
        }),
      },
    };
  }
  start(options) {
    return makeTape(
      this.session,
      this.configuration.extendsTape(options)
    );
  }
  startAsync(configuration) {
    return makeTapeAsync(
      this.session,
      this.configuration.extendsTape(options)
    );
  }
  async terminateAsync(reason) {
    runtime.makeRecorder = getNoopRecorder;
    this.stopThreading();
    this.unhook();
    return this.session.terminate();
  }

    this.session.terminateAsync();

    this.private.channel.request(
      {
        action: "terminate",
        session: this.private.session,
        data: reason,
      },
      false
    );
    this.cleanup();
  }
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
  }
}

const finalize = (response, {request, requestAsync}) => {

  if (response === null) {
    runtime = singleton.runtime;
    return singleton;
  }

  const { session, hooks } = response;


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



exports.makeAppmap = (RequestComponent, options) => {
  const request = RequestComponent.makeRequest
};

exports.makeAppmapAsync = (options) => {
  expect(runtime === null, "cannot have concurrent appmaps");
  const { channel, query } = prepare(options);
  runtime = PENDING;
  return channel
    .requestAsync(query, false)
    .then((response) => finalize(response, channel));
};

exports.makeAppmap = (options) => {
  expect(runtime === null, "cannot have conurrent appmaps");
  const { channel, query } = prepare(options);
  return finalize(channel.request(query, false), channel);
};
