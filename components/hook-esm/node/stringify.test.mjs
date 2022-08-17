import { assertEqual, assertThrow } from "../../__fixture__.mjs";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Stringify from "./stringify.mjs";

const { stringifyContent } = Stringify(
  await buildTestDependenciesAsync(import.meta.url),
);

assertEqual(stringifyContent("123;"), "123;");
{
  const content = "123;";
  const view = new Uint8Array(content.length);
  for (let index = 0; index < content.length; index += 1) {
    view[index] = "123;".charCodeAt(index);
  }
  assertEqual(stringifyContent(view), content);
}
assertThrow(() => stringifyContent(123));
