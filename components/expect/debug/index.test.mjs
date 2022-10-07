import { assertEqual } from "../../__fixture__.mjs";
import {
  expect,
  expectSuccess,
  expectSuccessAsync,
} from "./index.mjs?env=test";

const { undefined, Promise } = globalThis;

assertEqual(expect(true, "%s", "foo"), undefined);
assertEqual(
  expectSuccess(() => 123, "%O"),
  123,
);
await expectSuccessAsync(Promise.resolve(123), "%O");
