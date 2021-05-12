
import {assert} from "./assert.mjs";

class Either {
  constructor(data) {
    this.data = data;
  }
}

export class Left extends Either {
  isLeft() {
    return true;
  }
  isRight() {
    return false;
  }
  fromLeft() {
    return this.data;
  }
  fromRight() {
    assert(false, "expected a right either, got a left either with: %o", this.data);
  }
  either(closure1, closure2) {
    return closure1(this.data);
  }
  mapBoth (closure) {
    return new Left(closure(this.data));
  }
  mapLeft (closure) {
    return new Left(closure(this.data));
  }
  mapRight (closure) {
    return this;
  }
  bind(closure) {
    return this;
  }
  bindAsync(closure) {
    return Promise.resolve(this);
  }
  unwrap () {
    throw new Error(this.data);
  }
}

export class Right extends Either {
  isLeft() {
    return false;
  }
  isRight() {
    return true;
  }
  fromLeft() {
    assert(false, "expected a left either, got a right either with: %o", this.data);
  }
  fromRight() {
    return this.data;
  }
  either(closure1, closure2) {
    return closure2(this.data);
  }
  mapBoth (closure) {
    return new Right(closure(this.data));
  }
  mapLeft (closure) {
    return this;
  }
  mapRight (closure) {
    return new Right(closure(this.data));
  }
  bind(closure) {
    return closure(this.data);
  }
  bindAsync (closure) {
    return closure(this.data);
  }
  unwrap () {
    return this.data;
  }
}

export const isLeft = (either) => either.isLeft();

export const isRight = (either) => either.isRight();

export const fromLeft = (either) => either.fromLeft();

export const fromRight = (either) => either.fromRight();

export const toEither = (callback, prefix, ...rest) => {
  try {
    return new Right(callback(...rest));
  } catch (error) {
    return new Left(`${prefix} >> ${error.message}`);
  }
};
