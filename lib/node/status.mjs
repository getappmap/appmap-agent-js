import Status from "../../dist/node/status.mjs";

const {
  process: { argv, cwd },
} = globalThis;

const { main } = Status({ log: "info" });

const root = argv[2] || cwd();

export default main(root);
