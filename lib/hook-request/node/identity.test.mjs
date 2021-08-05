import {createRequire} from "module";
import DefaultHttp from "http";
import TotalHttp from "http";

const require = createRequire(import.meta.url);

const CommonHttp = require("http");

console.log("identity: default - total", DefaultHttp === TotalHttp);
console.log("identity: default - common", DefaultHttp === CommonHttp);
console.log("identity: common - total", CommonHttp === TotalHttp);

DefaultHttp.foo = "FOO";
TotalHttp.bar = "BAR";
CommonHttp.qux = "QUX";

console.log("foo", DefaultHttp.foo, TotalHttp.foo, CommonHttp.foo);
console.log("bar", DefaultHttp.bar, TotalHttp.bar, CommonHttp.bar);
console.log("qux", DefaultHttp.qux, TotalHttp.qux, CommonHttp.qux);
