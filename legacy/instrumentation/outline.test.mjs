import { strict as Assert } from "assert";
import { parse, dive } from "./__fixture__.mjs";
import { buildTestAsync } from "../../../build/index.mjs";
import Outline from "./outline.mjs";

const testAsync = async () => {
  const { makeOutline } = Outline(await buildTestAsync(import.meta));
  const { loc, ...rest } = makeOutline(123, dive(parse(";"), ["body", "0"]), {
    name: "foo",
  });
  Assert.equal(typeof loc, "object");
  Assert.deepEqual(rest, {
    type: "EmptyStatement",
    index: 123,
    span: [0, 1],
    info: { name: "foo" },
    caption: { origin: null, name: null },
  });
};

testAsync();
