import Init from "../../dist/node/init.mjs";

const {
  process: { argv, cwd },
} = globalThis;

const { main } = Init({ log: "info" });

const root = argv[2] || cwd();

export default main(root);
