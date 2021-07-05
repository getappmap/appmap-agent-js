import {noop, getUniqueIdentifier} from "../../../util/index.mjs";
import { Serializer } from "./serializer.mjs";
import { Track } from "./track.mjs";
import { Session } from "./session.mjs";

/* eslint-disable no-eval */
const global_eval = eval;
/* eslint-enable no-eval */
const global_Object_assign = Object.assign;
const global_undefined = undefined;

let runtime = null;

const Appmap = class {
  constructor (client, {runScript, getCurrentGroupID, start, stop}, instrumenter, options) {
    expect(runtime === null, "cannot run two appmaps concurrently");
    const session = new Session(
      platform,
      client,
      getUniqueIdentifier(),
      options
    );
    this.track_counter = 0;
    const serializer = new Serializer();
    const {recordBeforeApply, recordAfterApply, ... recordObject} = createProtocol(session, {serializer, instrumenter});
    this.platform = platform;
    platform.start({
      linkGroup: (child, parent) => sesssion.linkGroup(child, parent),
      instrument: (type, path, content) => {
        const {entity, code} = instrumenter.instrument(type, path, content);
        session.registerEntity(path, entity);
        return code;
      },
      ... recordObject
    });
    const hidden = instrumenter.getHiddenIdentifier();
    platform.runScript(`'use strict'; let ${hidden} = {empty:null, recordApplyBeginEvent:null, recordApplyEndEvent:null};`);
    runtime = global_eval(hidden);
    runtime.empty = serializer.getEmptyValue();
    runtime.recordBeforeApply = recordBeforeApply;
    runtime.recordAfterApply = recordAfterApply;
  }
  startTrack (options) {
    return new Track(
      this.session,
      this.track_counter += 1,
      options
    );
  }
  terminate (data) {
    runtime.recordApplyBeginEvent = noop;
    runtime.recordApplyEndEvent = noop;
    runtime = null;
    this.platform.stop();
    this.session.terminate(data);
  }
}
