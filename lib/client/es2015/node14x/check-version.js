const global_Error = Error;
const global_parseInt = parseInt;
const global_process = process;

const check = (process) => {
  if (global_parseInt(process.version[1] + process.version[2], 10) < 14) {
    throw new global_Error(
      "Incompatible node version, expected at least: v14.x"
    );
  }
};

// exposed for testing
module.exports = check;

check(global_process);
