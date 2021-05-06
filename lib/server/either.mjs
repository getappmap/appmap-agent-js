class Either {
  constructor(data) {
    this.data = data;
  }
  // either //
  isLeft() {
    return false;
  }
  isRight() {
    return false;
  }
  fromLeft() {
    throw new Error('expected a left either');
  }
  fromRight() {
    throw new Error('expected a right either');
  }
  // either () {
  //   throw new Error("either should be overwritten");
  // }
  // // functor //
  // fmap () {
  //   throw new Error("fmap should be overwritten");
  // }
  // // monad //
  // bind () {
  //   throw new Error("bind should be overwritten");
  // }
  // then () {
  //   throw new Error("then should be overwritten")
  // }
}

export class Left extends Either {
  isLeft() {
    return true;
  }
  fromLeft() {
    return this.data;
  }
  either(closure1, closure2) {
    return closure1(this.data);
  }
  fmap(closure) {
    return this;
  }
  bind(closure) {
    return this;
  }
  then(closure) {
    return this;
  }
}

export class Right extends Either {
  isRight() {
    return true;
  }
  fromRight() {
    return this.data;
  }
  either(closure1, closure2) {
    return closure2(this.data);
  }
  fmap(closure) {
    return new Right(closure(this.data));
  }
  bind(closure) {
    return closure(this.data);
  }
  then(closure) {
    return closure();
  }
}
