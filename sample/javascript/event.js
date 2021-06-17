const EventEmitter = require("events");

const emitter = new EventEmitter();
const listener1 = function (...args) {
  const [self, ... listeners] = this.rawListeners("foo");
  console.assert(self === listener1);
  emitter.removeAllListeners();
  for (const listener of listeners) {
    console.log(Reflect.apply(listener, this, args));
  }
};
emitter.on("foo", listener1);
emitter.on("foo", function (...args) { return {this:this, args}; });

emitter.emit("foo", 1, 2, 3);
