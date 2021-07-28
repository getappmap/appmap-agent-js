import { strict as Assert } from "assert";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { buildTestAsync } from "../../../build/index.mjs";
import Repository from "./index.mjs";

const { equal: assertEqual } = Assert;

const { url } = import.meta;

const testAsync = async () => {
  const { extractRepositoryPackage, extractRepositoryDependencyPackage } =
    Repository(await buildTestAsync(import.meta));
  let path = fileURLToPath(url);
  while (!path.endsWith("appmap-agent-js")) {
    path = dirname(path);
  }
  {
    const { name, version } = extractRepositoryPackage(path);
    assertEqual(name, "@appland/appmap-agent-js");
    assertEqual(typeof version, "string");
  }
  {
    const { name, version } = extractRepositoryDependencyPackage(path, "acorn");
    assertEqual(name, "acorn");
    assertEqual(typeof version, "string");
  }
};

testAsync();
