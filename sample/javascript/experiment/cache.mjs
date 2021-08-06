
import {createRequire} from "module";
const require = createRequire(import.meta.url);
// import "./cache-module.cjs";

// require("./cache-module.cjs");

console.log(require.cache);
