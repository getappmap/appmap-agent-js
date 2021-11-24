import Status from '../../dist/node/status.mjs';

const { main } = Status({ log: "info" });

const root = process.argv[2] || process.cwd();
process.exit((main(root)) ? 0 : 1);
