
import spawnSync from "../spawn-sync.mjs";

export default (path1, path2, options) => {
  options = {
    tool: "c8",
    check: true,
    reporter: "text-summary",
    vm: false,
    ...options
  };
  const argv = [];
  argv.push(
    options.tool,
    `--reporter=${options.reporter}`,
    `--temp-dir=tmp/${options.tool}-temp/`,
    `--report-dir=tmp/${options.tool}-report/`,
    `--include=${path1}`
  );
  if (options.vm) {
    argv.push("--hook-run-in-this-context")
  }
  if (options.check) {
    argv.push(
      '--check-coverage',
      '--branches=100',
      '--functions=100',
      '--lines=100',
      '--statements=100'
    );
  }
  argv.push('node', path2);
  spawnSync("npx", argv, null);
  if (options.reporter === "html") {
    spawnSync("open", [`tmp/${options.tool}-report/index.html`], null);
  }
};
