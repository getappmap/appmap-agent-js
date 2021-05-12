import { strict as Assert } from 'assert';
import {
  toEither,
  isLeft,
  isRight,
  fromLeft,
  fromRight,
  Left,
  Right,
} from '../../../../lib/server/either.mjs';

// isLeft //

Assert.equal(new Left('foo').isLeft(), true);

Assert.equal(new Right('foo').isLeft(), false);

// isRight //

Assert.equal(new Left('foo').isRight(), false);

Assert.equal(new Right('foo').isRight(), true);

// fromLeft //

Assert.equal(new Left('foo').fromLeft(), 'foo');

Assert.throws(
  () => new Right('foo').fromLeft(),
  /^Error: expected a left either/,
);

// fromRight //

Assert.equal(new Right('foo').fromRight(), 'foo');

Assert.throws(
  () => new Left('foo').fromRight(),
  /^Error: expected a right either/,
);

// either //

Assert.equal(
  new Left('foo').either(
    (...args) => {
      Assert.deepEqual(args, ['foo']);
      return 'bar';
    },
    () => {
      Assert.fail();
    },
  ),
  'bar',
);

Assert.equal(
  new Right('foo').either(
    () => {
      Assert.fail();
    },
    (...args) => {
      Assert.deepEqual(args, ['foo']);
      return 'bar';
    },
  ),
  'bar',
);

// mapBoth //

Assert.equal(
  new Left('foo')
    .mapBoth((...args) => {
      Assert.deepEqual(args, ['foo']);
      return 'bar';
    })
    .fromLeft(),
  'bar',
);

Assert.equal(
  new Right('foo')
    .mapBoth((...args) => {
      Assert.deepEqual(args, ['foo']);
      return 'bar';
    })
    .fromRight(),
  'bar',
);

// mapLeft //

Assert.equal(
  new Right('foo')
    .mapLeft(() => {
      Assert.fail();
    })
    .fromRight(),
  'foo',
);

Assert.equal(
  new Left('foo')
    .mapLeft((...args) => {
      Assert.deepEqual(args, ['foo']);
      return 'bar';
    })
    .fromLeft(),
  'bar',
);

// mapRight //

Assert.equal(
  new Left('foo')
    .mapRight(() => {
      Assert.fail();
    })
    .fromLeft(),
  'foo',
);

Assert.equal(
  new Right('foo')
    .mapRight((...args) => {
      Assert.deepEqual(args, ['foo']);
      return 'bar';
    })
    .fromRight(),
  'bar',
);

// bind //

Assert.equal(
  new Left('foo')
    .bind(() => {
      Assert.fail();
    })
    .fromLeft(),
  'foo',
);

Assert.equal(
  new Right('foo')
    .bind((...args) => {
      Assert.deepEqual(args, ['foo']);
      return new Right('bar');
    })
    .fromRight(),
  'bar',
);

// bindAsync //

new Left('foo')
  .bindAsync(() => {
    Assert.fail();
  })
  .then((either) => {
    Assert.equal(either.fromLeft(), 'foo');
  });

new Right('foo')
  .bindAsync((...args) => {
    Assert.deepEqual(args, ['foo']);
    return Promise.resolve(new Right('bar'));
  })
  .then((either) => {
    Assert.equal(either.fromRight(), 'bar');
  });

// toEither //

Assert.equal(
  toEither(
    (...args) => {
      Assert.deepEqual(args, ['foo', 'bar']);
      return 'qux';
    },
    'prefix',
    'foo',
    'bar',
  ).fromRight(),
  'qux',
);

Assert.equal(
  toEither(
    (...args) => {
      Assert.deepEqual(args, ['foo', 'bar']);
      throw new Error('qux');
    },
    'prefix',
    'foo',
    'bar',
  ).fromLeft(),
  'prefix >> qux',
);

// others //

Assert.equal(isLeft(new Left('foo')), true);

Assert.equal(isRight(new Right('foo')), true);

Assert.equal(fromLeft(new Left('foo')), 'foo');

Assert.equal(fromRight(new Right('foo')), 'foo');
