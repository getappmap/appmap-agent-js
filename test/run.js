
const Crypto = require("crypto");
const FileSystem = require("fs");
const FileSystemPromise = require("fs/promise");
const ChildProcess = require("child_process");

const progress = new Map(FileSystem.readFileSync(".progress.json"));

const runAsync = async (path) => {
  let dir = null;
  try {
    dir = await FileSystemPromise.opendir(path);
  } catch (error) {
    // noop
  }
  for await (const dirent of dir) {
    await runAsync
  }

  try {
    await FileSystemPromise.access(path, FileSystem.R_OK);
  } catch
  const stat = await FileSystemPromise.stat(path);


  const hash = Crypto.createHash("md5");

};




const input = createReadStream(filename);
input.on('readable', () => {
  // Only one element is going to be produced by the
  // hash stream.
  const data = input.read();
  if (data)
    hash.update(data);
  else {
    console.log(`${hash.digest('hex')} ${filename}`);
  }
});


const fs =

const check = [
  '--check-coverage',
  '--branches=100',
  '--functions=100',
  '--lines=100',
  '--statements=100'
].join(" ");


const command = [
  "shared/util/print",
  "shared/util/format",
  "shared/util/check",
  "shared/util/assert",
  "shared/util/expect",
  "shared/util/noop",
  "shared/util/path",
].map(
  (path) => `npx c8 ${check} --include=lib/${path}.js node lib/${path}.test.js`
).join(" && ");

ChildProcess.spawnSync("/bin/sh", ["-c", command], {stdio:"inherit"});
