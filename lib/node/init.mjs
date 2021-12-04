import Init from "../../dist/node/init.mjs";

const { main } = Init({ log: "info" });

const root = process.argv[2] || process.cwd();
const ret = await main(root);
process.exit(ret ? 0 : 1);
