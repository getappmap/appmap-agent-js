import { strict as Assert } from "assert";
import { parse, dive } from "./__fixture__.mjs";
import { buildAllAsync } from "../../../build.mjs";
import Outline from "./outline.mjs";

const mainAsync = async () => {
  const { makeOutline } = Outline(await buildAllAsync(["util"]));
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

mainAsync();
