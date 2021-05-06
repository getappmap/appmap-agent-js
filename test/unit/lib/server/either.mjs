
import {strict as Assert} from "assert";
import {Left, Right} from '../../../../lib/server/either.mjs';

Assert.equal(
  new Left("foo").isLeft(),
  true
);

Assert.equal(
  new Right("foo").isLeft(),
  false
);

Assert.equal(
  new Left("foo").isRight(),
  false
);

Assert.equal(
  new Right("foo").isRight(),
  true
);

Assert.equal(
  new Left("foo").fromLeft(),
  "foo"
);

Assert.equal(
  new Right("foo").fromRight(),
  "foo"
);

Assert.throws(
  () => new Left("foo").fromRight(),
  /^Error: expected a right either/
);

Assert.throws(
  () => new Right("foo").fromLeft(),
  /^Error: expected a left either/
);

Assert.equal(
  new Left("foo").either((...args) => {
    Assert.deepEqual(args, ['foo']);
    return "bar"
  }, () => { Assert.fail() }),
  "bar"
);

Assert.equal(
  new Right("foo").either(() => { Assert.fail() }, (...args) => {
    Assert.deepEqual(args, ['foo']);
    return "bar"
  }),
  "bar"
);

Assert.equal(
  new Left("foo").fmap(() => { Assert.fail() }).fromLeft(),
  "foo"
);

Assert.equal(
  new Right("foo").fmap((...args) => {
    Assert.deepEqual(args, ["foo"]);
    return "bar";
  }).fromRight(),
  "bar"
);

Assert.equal(
  new Left("foo").bind(() => { Assert.fail() }).fromLeft(),
  "foo"
);

Assert.equal(
  new Right("foo").bind((...args) => {
    Assert.deepEqual(args, ["foo"]);
    return new Right("bar");
  }).fromRight(),
  "bar"
);

Assert.equal(
  new Left("foo").then(() => { Assert.fail() }).fromLeft(),
  "foo"
);

Assert.equal(
  new Right("foo").then((...args) => {
    Assert.deepEqual(args, []);
    return new Right("bar");
  }).fromRight(),
  "bar"
);
