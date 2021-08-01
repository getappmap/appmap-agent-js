import { strict as Assert } from "assert";
import { buildTestAsync } from "../../../build/index.mjs";
import Metadata from "./metadata.mjs";

Error.stackTraceLimit = Infinity;

const {
  deepEqual: assertDeepEqual,
  // equal: assertEqual,
} = Assert;

const testAsync = async () => {
  const dependencies = await buildTestAsync({
    ...import.meta,
    deps: ["configuration"],
  });
  const {
    configuration: { createConfiguration, extendConfiguration },
  } = dependencies;
  const { compileMetadata } = Metadata(dependencies);

  const test = (conf, cwd) => {
    let configuration = createConfiguration(cwd);
    configuration = extendConfiguration(configuration, conf, cwd);
    // console.log(configuration);
    return compileMetadata(configuration);
  };

  const default_meta_data = {
    name: null,
    app: null,
    labels: [],
    language: { name: 2020, version: "ecmascript", engine: null },
    frameworks: [],
    client: { name: undefined, version: undefined, url: undefined },
    recorder: undefined,
    recording: { defined_class: undefined, method_id: null },
    git: {
      repository: null,
      branch: null,
      commit: null,
      status: null,
      tag: null,
      annotated_tag: null,
      commits_since_tag: null,
      commits_since_annotated_tag: null,
    },
    test_status: null,
    exception: null,
  };

  assertDeepEqual(test({}, "/cwd"), default_meta_data);

  // app //

  assertDeepEqual(test({ app: { name: "app-name" } }, "/cwd"), {
    ...default_meta_data,
    app: "app-name",
  });

  // name //

  assertDeepEqual(test({ map: { name: "map-name" } }, "/cwd"), {
    ...default_meta_data,
    name: "map-name",
  });

  assertDeepEqual(test({ output: { filename: "filename" } }, "/cwd"), {
    ...default_meta_data,
    name: "filename",
  });

  assertDeepEqual(test({ main: { path: "/foo/main" } }, "/cwd"), {
    ...default_meta_data,
    name: "main",
  });

  // engine //

  assertDeepEqual(
    test(
      { engine: { name: "engine-name", version: "engine-version" } },
      "/cwd",
    ),
    {
      ...default_meta_data,
      language: {
        ...default_meta_data.language,
        engine: "engine-name@engine-version",
      },
    },
  );

  assertDeepEqual(
    test({ engine: { name: "engine-name", version: null } }, "/cwd"),
    {
      ...default_meta_data,
      language: {
        ...default_meta_data.language,
        engine: "engine-name",
      },
    },
  );
};

testAsync();
