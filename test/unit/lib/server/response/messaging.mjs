
import { strict as Assert } from 'assert';
import EventEmitter from "events";
import {registerChild} from '../../../../../lib/server/response/messaging.mjs';

const trace = [];

const dispatcher = {
  __proto__: null
};

const child = {
  __proto__: new EventEmitter(),
  send (...args) {
    Assert.equal(this, child);
    trace.push(args);
  }
};

registerChild(child, dispatcher);

dispatcher.dispatch = function dispatch (...args) {
  Assert.equal(this, dispatcher);
  trace.push(args);
  return "qux";
};

child.emit("error", new Error("foo"));

child.emit("message", {
  query: null
});

child.emit("message", {
  index: null
});

child.emit("message", {
  index: null,
  query: "foo"
});

child.emit("message", {
  index: 123,
  query: "bar"
});

dispatcher.dispatch = () => { throw new Error("BOUM") };

child.emit("message", {
  index: 456,
  query: "buz"
});

Assert.deepEqual(trace, [["foo"], ["bar"], [{
  index: 123,
  success: "qux",
  failure: null
}], [{
  index: 456,
  success: null,
  failure: "BOUM"
}]]);
