
import {createRequire} from "module";
const require = createRequire(import.meta.url);

const cjs1 = require("./identity-module-1.js");
import * as esm11 from "./identity-module-1.js";
const esm12 = await import("./identity-module-1.js");
import def1 from "./identity-module-1.js";
const module1 = {cjs:cjs1, esm1:esm11, esm2:esm12, def:def1};

const cjs2 = require("./identity-module-2.js");
import * as esm21 from "./identity-module-2.js";
const esm22 = await import("./identity-module-2.js");
import def2 from "./identity-module-2.js";
const module2 = {cjs:cjs2, esm1:esm21, esm2:esm22, def:def2};

function identities (object) {
  const keys = Reflect.ownKeys(object);
  const {length} = keys;
  for (let index1 = 0; index1 < length; index1 +=1) {
    const key1 = keys[index1];
    for (let index2 = index1 + 1; index2 < length; index2 +=1) {
      const key2 = keys[index2];
      if (object[key1] === object[key2]) {
        console.log(key1, "===", key2);
      }
    }
  }
}

console.log("\nIdentity Module1:");
identities(module1);

console.log("\nIdentity Module2:");
identities(module2);
