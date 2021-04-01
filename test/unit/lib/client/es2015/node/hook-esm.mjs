import { strict as Assert } from 'assert';
import hookESM from "../../../../../../lib/client/es2015/node/hook-esm.js";

const PATH = `file://localhost/foo/bar.mjs`;
const CONTENT1 = `module.exports = 123;`;
const CONTENT2 = `export default 456;`;
const CONTENT3 = `export default 789;`;

const transformSource = hookESM((...args) => {
  Assert.equal(args.length, 3);
  Assert.equal(args[0], CONTENT1);
  Assert.equal(args[1], "/foo/bar.mjs");
  Assert.equal(typeof args[2], "object");
  Assert.equal(typeof args[2].resolve, "function");
  Assert.equal(typeof args[2].reject, "function");
  args[2].resolve(CONTENT2);
});

const defaultTransformSource = (...args) => {
  Assert.equal(args.length, 3);
  Assert.equal(args[0], CONTENT1);
  Assert.deepEqual(args[1], {format:"foobar", url:PATH});
  Assert.deepEqual(args[2], defaultTransformSource);
  return new Promise((resolve, reject) => {
    resolve({source:CONTENT3});
  });
};

transformSource(CONTENT1, {format:"module", url:PATH}, () => Assert.fail()).then((result) => {
  Assert.deepEqual(result, {source:CONTENT2});
});

transformSource((new TextEncoder()).encode(CONTENT1), {format:"module", url:PATH}, () => Assert.fail()).then((result) => {
  Assert.deepEqual(result, {source:CONTENT2});
});

transformSource(CONTENT1, {format:"foobar", url:PATH}, defaultTransformSource).then((result) => {
Assert.deepEqual(result, {source:CONTENT3});
});
