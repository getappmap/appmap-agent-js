import { strict as Assert } from "assert";
import { createExposedPromise } from "./promise.mjs";

(async () => {
  {
    const { promise, resolve } = createExposedPromise();
    resolve(123);
    Assert.equal(await promise, 123);
  }
  {
    const { promise, reject } = createExposedPromise();
    reject(new Error("BOUM"));
    try {
      await promise;
      Assert.fail();
    } catch (error) {
      Assert.equal(error.message, "BOUM");
    }
  }
})().catch((error) => {
  throw error;
});
