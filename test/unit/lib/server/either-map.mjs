
import {strict as Assert} from "assert";
import {EitherMap} from '../../../../lib/server/either-map.mjs';

const map = new EitherMap();

{
  const key = map.push("foo");
  Assert.equal(typeof key, "string");
  Assert.equal(map.has(key), true);
  Assert.equal(map.get(key).fromRight(), "foo");
  Assert.equal(map.set(key, "bar").fromRight(), null);
  Assert.equal(map.take(key).fromRight(), "bar");
  Assert.equal(map.has(key), false);
}

{
  const key = map.push("qux");
  Assert.equal(map.delete(key).fromRight(), null);
  Assert.equal(map.has(key), false);
  Assert.ok(map.get(key).isLeft());
  Assert.ok(map.set(key).isLeft());
  Assert.ok(map.take(key).isLeft());
  Assert.ok(map.delete(key).isLeft());
}
