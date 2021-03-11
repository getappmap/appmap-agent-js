'use strict';

const engine = require('../engine.js');
const package = require('../package.json');

exports.make = (name) => ({
  version: "1.4",
  metadata: {
    name: 'Optional >> scenario name.',
    labels: 'Optional >> list of arbitrary labels describing the AppMap.',
    app: config.getAppName(),
    feature:
      'Optional >> name of the feature to associate with the scenario. If the named feature does not exist, it may be created.',
    feature_group:
      'Optional >> name of the feature group to associate with the scenario. If the named feature group does not exist, it may be created.',
    language: {
      name: 'javascript',
      engine: `${engine.getName()}@${engine.getVersion()}`,
      version: 'ECMAScript2020',
    },
    client: {
      name: package.name,
      url: package.url,
      version: package.version,
    },
    recorder: {
      name: 'default',
    },
    recording: {
      defined_class:
        'Required >> name of the class which defines the entry-point function.',
      method_id: 'Required name of the recorded function.',
    },
    git: git.isRepository()
      ? {
          repository: git.getRepositoryURL(),
          branch: git.getBranchName(),
          commit: git.getCommitHash(),
          status:
            'Required >> status of the repo relative to the commit, represented as a list of status messages. If the repo is clean, the status should be an empty list.',
          tag: 'Optional >> latest tag.',
          annotated_tag: 'Optional latest annotated tag.',
          commits_since_tag:
            'Optional >> number of commits since the last tag.',
          commits_since_annotated_tag:
            'Optional >> number of commits since the last annotated tag.',
        }
      : null,
  },
});
