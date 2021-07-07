import {noop} from "../../../util/index.mjs";
import { createSession } from "./session.mjs";
import { createTrack } from "./track.mjs";
import { createRecorder } from "./serializer.mjs";
import { createSerializer } from "./serializer.mjs";

/* eslint-disable no-eval */
const global_eval = eval;
/* eslint-enable no-eval */

let running = null;

export default = () => ({client, interpretation, instrumentation}, options) => (getCurrentAsync, options) => {
  expect(running === null, "multiple appmap instances are not allowed to run concurrently");
  const {linkGroup, terminate, registerEntity, controlTrack, recordBeforeEvent, recordAfterEvent} = new Session(
    client,
    getCurrentAsync,
    options,
  );
  const {hidden, instrument} = instrumentation(options);
  const increment = makeIncrement();
  const {empty, serialize, serializeError} = createSerializer();
  const {runScript} = interpretation();
  const {recordBeforeApplyEvent, recordAfterApplyEvent, ...recordRest} = createRecorder({recordBeforeEvent, recordAfterEvent}, {serialize, serializeError});
  runScript(`'use strict'; const ${hidden} = {empty:null, recordBeginApplyEvent:null, recordEndApplyEvent:null};`);
  const runtime = global_eval(hidden);
  runtime.empty = empty;
  runtime.recordBeforeApplyEvent = recordBeforeApplyEvent;
  runtime.recordAfterApplyEvent = recordAfterApplyEvent;
  running = runtime;
  return {
    linkAsync,
    instrument: (source, path, content) => {
      const {entity, code} = instrument(source, path, content);
      registerEntity(path, entity);
      return code;
    },
    ... recordRest,
    startTrack: (options) => createTrack(
      controlTrack,
      increment(),
      options,
    ),
    terminate: (data) => {
      assert(runtime === runing, "this appmap instance has already been terminated");
      running = null;
      runtime.recordApplyBeginEvent = noop;
      runtime.recordApplyEndEvent = noop;
      terminate(data);
    },
  };
});
