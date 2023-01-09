import { strict as Assert } from "node:assert";
const { equal: assertEqual } = Assert;
const { Promise } = globalThis;
async function mainAsync(x) {
  assertEqual(x, 123);
  return await new Promise(function promiseCallback(resolve, _reject) {
    resolve(456);
  });
}
assertEqual(await mainAsync(123), 456);
