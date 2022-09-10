import { assertEqual, assertFail } from "../../__fixture__.mjs";

import { fromMaybe, mapMaybe, recoverMaybe } from "./maybe.mjs";

const {String} = globalThis;

// recoverMaybe //

assertEqual(recoverMaybe(null, 123), 123);

assertEqual(recoverMaybe(123, 456), 123);

// fromMaybe //

assertEqual(
  fromMaybe(null, 123, () => assertFail()),
  123,
);

assertEqual(fromMaybe(123, 456, String), "123");

// mapMaybe //

assertEqual(
  mapMaybe(null, () => assertFail()),
  null,
);

assertEqual(
  mapMaybe("foo", (x) => x + x),
  "foofoo",
);
