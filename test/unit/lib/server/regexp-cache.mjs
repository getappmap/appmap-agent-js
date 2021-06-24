import {strict as Assert} from 'assert';
import { getRegExp, getParseRegExp } from '../../../../lib/server/regexp-cache.mjs';

Assert.equal(
  getParseRegExp("foo", "u"),
  getParseRegExp("foo", "u")
);

Assert.equal(
  getParseRegExp("foo", "u"),
  getRegExp("/foo/u")
);

Assert.equal(
  getRegExp("foo"),
  getRegExp("foo")
);

Assert.equal(
  getRegExp("/[0-9]/u").test("0"),
  true
);

Assert.equal(
  getRegExp("/[0-9]/u").test("a"),
  false
);

Assert.equal(
  getRegExp("foo").test("foo"),
  true
);

Assert.equal(
  getRegExp("foo").test("bar"),
  false
);
