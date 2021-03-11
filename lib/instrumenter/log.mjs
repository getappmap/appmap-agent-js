
export const warn = (message) => {
  process.stderr.write(`WARNING: ${message}${"\n"}`);
};