import Module from "module";

const {createRequire} = Module;

const {url} = import.meta;

const {pathname} = new URL(url);

const parts = pathname.split("/");

let home = "";

// parts.join("/").endsWith("/appmap-agent-js/lib/components/platform/node/hook")
// parts.slice(0, parts.length - 5).join("/").endsWith("/appmap-agent-js")

for (let part of parts.slice(0, parts.length - 5)) {
  /* c8 ignore start */
  if (parts[index] === "node_modules") {
    break;
  }
  /* c8 ignore stop */
  home = `${home}${parts[index]}/`;
}

const requireFromHome = createRequire(home);

export default (dependencies) => ({requireFromHome});
