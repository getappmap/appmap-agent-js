// import * from engine = require('../engine.js');
import * as Fs from 'fs';
import * as Url from 'url';
import * as Config from './config.mjs';
import * as Git from './git.mjs';

const client = Fs.readFileSync(new Url.URL(import.meta.url).pathname, 'utf8');

const APPMAP_VERSION = '1.4';

export class AppMap {
  constructor() {
    this.appmap = {
      version: APPMAP_VERSION,
      metadata: {
        name: 'Optional >> scenario name.',
        labels: 'Optional >> list of arbitrary labels describing the AppMap.',
        app: Config.getAppName(),
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
          name: client.name,
          url: client.url,
          version: client.version,
        },
        recorder: {
          name: 'default',
        },
        recording: {
          defined_class:
            'Required >> name of the class which defines the entry-point function.',
          method_id: 'Required name of the recorded function.',
        },
        git: Git.isRepository()
          ? {
              repository: Git.getRepositoryURL(),
              branch: Git.getBranchName(),
              commit: Git.getCommitHash(),
              status: Git.getStatus(),
              tag: Git.getLatestTag(),
              annotated_tag: Git.getLatestAnnotatedTag(),
              commits_since_tag: Git.getNumberCommitsSinceLatestTag(),
              commits_since_annotated_tag: Git.getNumberCommitsSinceLatestAnnotatedTag(),
            }
          : null,
      },
    };
  }
}
