const global_Error = Error;
const global_parseInt = parseInt;

exports.checkVersion = (process) => {
  if (global_parseInt(process.version[1] + process.version[2], 10) < 14) {
    throw new global_Error(
      "incompatible node version, expected at least: v14.x"
    );
  }
};
