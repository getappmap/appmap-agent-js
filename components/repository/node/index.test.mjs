import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Repository from "./index.mjs";

const { extractRepositoryPackage, extractRepositoryDependency } = Repository(
  await buildTestDependenciesAsync(import.meta.url),
);

const getHomeURL = () => {
  const { url } = import.meta;
  const url_object = new URL(url);
  url_object.pathname += "/..";
  while (!url_object.pathname.endsWith("/appmap-agent-js/")) {
    url_object.pathname += "..";
  }
  return url_object.toString();
};

const url = getHomeURL();

assertDeepEqual(extractRepositoryPackage(`${url}/lib`), null);
{
  const { name, version, homepage } = extractRepositoryPackage(url);
  assertEqual(name, "@appland/appmap-agent-js");
  assertEqual(
    homepage,
    "https://github.com/applandinc/appmap-agent-js.git/#readme",
  );
  assertEqual(typeof version, "string");
}
{
  const {
    directory,
    package: { name, version },
  } = extractRepositoryDependency(url, ["acorn"]);
  assertEqual(name, "acorn");
  assertEqual(typeof directory, "string");
  assertEqual(typeof version, "string");
}
