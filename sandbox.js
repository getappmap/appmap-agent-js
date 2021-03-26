// node bin/client.mjs -- sandbox.js


class Counter {
  constructor () {
    this.state = 0;
  }
  incrementBy (amount) {
    const plus = (left, right) => left + right;
    this.state = plus(this.state, amount);
  }
  increment () {
    this.incrementBy(1);
    return this.state;
  }
}

const counter = new Counter();
counter.increment();
