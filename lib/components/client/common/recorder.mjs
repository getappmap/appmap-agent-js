
const {noop} = require('../../util.js');

const global_Date_now = Date.now;

const STATE0 = 0;
const STATE1 = 1;
const STATE2 = 2;

const singleton = {
  recordCall: noop,
  recrodReturn: noop,
};

exports.getNoopRecorder = () => singleton;

exports.Record = class Record {
  constructor (origin, common) {
    this.origin = origin;
    this.common = common;
    this.timestamp = global_Date_now();
    this.id = common.counter += 1;
    this.state = STATE0;
  }
  static recordThread (common, payload) {
    common.record(
      {
        type: "thread",
        id: common.counter += 1,
        thread_id: this.common.getCurrentThreadId(),
        thread: payload
      }
    );
  }
  recordCall(payload) {
    assert(this.state === STATE0, "invalid state for recordCall");
    this.state = STATE1;
    this.common.record(
      {
        type: "call",
        id: this.id,
        thread_id: this.common.getCurrentThreadId(),
        origin: this.origin,
        payload
      }
    );
  }
  recordReturn(payload) {
    assert(this.state === STATE1, "invalid state for recordReturn");
    this.state = STATE2;
    this.common.record(
      {
        type: "return",
        id: this.common.counter += 1,
        thread_id: this.common.getCurrentThreadId(),
        parent_id: this.id,
        elapsed: (global_Date_now() - this.timestamp) / 1000,
        payload
      }
    );
  },
}
