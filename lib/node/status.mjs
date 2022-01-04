import Status from "../../dist/node/status.mjs";

const { main } = Status({ log: "info" });

const root = process.argv[2] || process.cwd();
main(root).then((ret) => {
  process.exit(ret ? 0 : 1);
});
