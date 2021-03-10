"use strict";

const package = require("../package.json");
const engine

exports.make = (name) => ({
  version: "1.4",
  metadata: {
    name: "Optional >> scenario name.",
    labels: "Optional >> list of arbitrary labels describing the AppMap.",
    app: "Optional >> name of the app to assign to the scenario. The organization to which the app belongs may be specified by separating the organization name and app name by a forward slash /. If no organization name is specified, the data is loaded into the user's personal data set. Example of a scoped name: myorg/myapp. Example of an unscoped name: myapp. The forward-slash character is illegal in app names and org names.",
    feature: "Optional >> name of the feature to associate with the scenario. If the named feature does not exist, it may be created.",
    feature_group: "Optional >> name of the feature group to associate with the scenario. If the named feature group does not exist, it may be created.",
    language: {
      name: "javascript",
      engine:
      version: "ECMAScript2021"
    },
    client: {
      name: package.name,
      url: package.url,
      version: package.version},
    recorder: {
      name: "Required name of the recording method. This name must be unique to the client, but need not be unique across different clients."
    },
    recording: {
      defined_class: "Required >> name of the class which defines the entry-point function.",
      method_id: "Required name of the recorded function."
    },
    git: {
      repository: "Required >> repository URL.",
      branch: "Required >> code branch.",
      commit: "Required >> commit identifier.",
      status: "Required >> status of the repo relative to the commit, represented as a list of status messages. If the repo is clean, the status should be an empty list.",
      tag: "Optional >> latest tag.",
      annotated_tag: "Optional latest annotated tag.",
      commits_since_tag: "Optional >> number of commits since the last tag.",
      commits_since_annotated_tag: "Optional >> number of commits since the last annotated tag."
    }
  }
});

