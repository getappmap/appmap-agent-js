import Status from '../../dist/node/status.mjs';

const { main } = Status({ log: "info" });

const root = process.argv[2] || process.cwd();
const ret = await main(root);
process.exit(ret? 0 : 1);
