console.log("LOADER");

const {unlinkSync, symlinkSync} = require("fs");

const link = process.argv[1];
console.log(link);
unlinkSync(link);
symlinkSync("./yo-bar.mjs", link);
