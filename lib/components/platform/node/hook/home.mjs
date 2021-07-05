import Module from "module";

const parts = new URL(import.meta.url).pathname.split("/");

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

export const requireFromHome = Module.createRequire(home);
