import { strict as Assert } from "assert";
import { buildAsync } from "../../../build/index.mjs";
import Path from "./path.mjs";

const { equal: assertEqual } = Assert;

const mainAsync = async () => {
  const { relativizePath } = Path(
    await buildAsync({ violation: "error", assert: "debug" }),
  );
  assertEqual(
    relativizePath("/foo/bar1", "/foo/bar2/qux/buz/.."),
    "../bar2/qux",
  );
};

mainAsync();
