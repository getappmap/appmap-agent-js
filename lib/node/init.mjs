import Init from '../../dist/node/init.mjs';

const { main } = Init({ log: "info" });

const root = process.argv[2] || process.cwd();
process.exit((main(root)) ? 0 : 1);
