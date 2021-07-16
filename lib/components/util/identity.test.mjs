import { strict as Assert } from "assert";
import {
  identity,
  returnFirst,
  returnSecond,
  returnThird,
} from "./identity.mjs";

Assert.equal(identity(123), 123);

Assert.equal(returnFirst(123, 456, 789), 123);

Assert.equal(returnSecond(123, 456, 789), 456);

Assert.equal(returnThird(123, 456, 789), 789);
