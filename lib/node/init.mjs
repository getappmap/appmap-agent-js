import Init from "../../dist/node/init.mjs";

const { main } = Init({ log: "info" });

const root = process.argv[2] || process.cwd();
main(root).then((ret) => {
  process.exit(ret ? 0 : 1);
});
