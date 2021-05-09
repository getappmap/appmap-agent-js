
import {Left, Right} from "./either.mjs";

export class EitherMap extends Map {
  constructor() {
    super();
    this.counter = 0n;
  }
  push (value) {
    this.counter += 1n;
    const key = this.counter.toString(36);
    super.set(key, value);
    return key;
  }
  take (key) {
    if (super.has(key)) {
      const value = super.get(key);
      super.delete(key);
      return new Right(value);
    }
    return new Left(`missing key: ${key}`);
  }
  get (key) {
    if (super.has(key)) {
      return new Right(super.get(key));
    }
    return new Left(`missing key: ${key}`);
  }
  set (key, value) {
    if (super.has(key)) {
      super.set(key, value);
      return new Right(null);
    }
    return new Left(`missing key: ${key}`);
  }
  delete (key) {
    if (super.delete(key)) {
      return new Right(null);
    }
    return new Left(`missing key: ${key}`);
  }
};
