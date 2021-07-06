import {noop} from "../../../util/index.mjs";
import { createSession } from "./session.mjs";
import { createTrack } from "./track.mjs";
import { createRecorder } from "./serializer.mjs";
import { createSerializer } from "./serializer.mjs";

/* eslint-disable no-eval */
const global_eval = eval;
/* eslint-enable no-eval */

let runtime = null;

export default = createFrontend = () => ({client:{send, close}, platform:{runScript, getCurrentGroupID, startHooking, stopHooking}, instrumenter:{hidden, instrument}}, options) => {
  expect(runtime === null, "cannot run two appmaps concurrently");
  runtime = global_eval(hidden);
  const {linkGroup, terminate, registerEntity, controlTrack, recordBeforeEvent, recordAfterEvent} = new Session(
    getCurrentGroupID,
    client,
    options,
  );
  const increment = makeIncrement();
  const {empty, serialize, serializeError} = createSerializer();
  const {recordBeforeApplyEvent, recordAfterApplyEvent, ...recorder} = createRecorder({recordBeforeEvent, recordAfterEvent}, {serialize, serializeError});
  runScript(`'use strict'; let ${hidden} = {empty:null, recordBeginApplyEvent:null, recordEndApplyEvent:null};`);
  runtime.empty = empty;
  runtime.recordBeforeApplyEvent = recordBeforeApplyEvent;
  runtime.recordAfterApplyEvent = recordAfterApplyEvent;
  startHooking(
    {
      linkGroup,
      instrument: (source, path, content) => {
        const {entity, code} = instrument(source, path, content);
        registerEntity(path, entity);
        return code;
      },
      ... recorder,
    }
  );
  return {
    startTrack: (options) => createTrack(
      controlTrack,
      increment(),
      options,
    ),
    terminate: (data) => {
      runtime.recordApplyBeginEvent = noop;
      runtime.recordApplyEndEvent = noop;
      runtime = null;
      stopHooking();
      terminate(data);
    }
  };
}
