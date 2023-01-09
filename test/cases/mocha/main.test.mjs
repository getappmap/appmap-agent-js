import { strict as Assert } from "assert";
import { describe, it } from "mocha";
import { main, mainAsync } from "./main.mjs";
const { setTimeout } = globalThis;
const { equal: assertEqual } = Assert;
describe("suite", function () {
  it("main", function () {
    assertEqual(main(), "main");
  });
  it("mainCallback", function (done) {
    setTimeout(done, 0);
  });
  it("mainAsync", async function () {
    assertEqual(await mainAsync(), "main");
  });
});
