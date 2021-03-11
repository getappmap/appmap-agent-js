
import * as Path from 'path';
import * as Fs from 'fs';
import * as Url from 'url';

import Logger from "./logger.mjs";

const APPMAP_VERSION = '1.4';

const client = Fs.readFileSync(Path.join(Path.dirname(new Url.URL(import.meta.url).pathname), '..', '..', 'package.json'), 'utf8');

export class Entity {
  constructor (type, name) {
    this.type = type;
    this.name = name;
  }
}

export class PackageEntity extends Entity {
  constructor (name, childeren = []) {
    super('package', name);
    this.childeren = childeren;
  }
}

exports class ClassEntity extends Entity {
  constructor (name, childeren = []) {
    super('class', name);
    this.childeren = childeren;
  }
}

export class AppMap {
  constructor(git, env) {
    this.env = env;
    this.appmap = {
      version: APPMAP_VERSION,
      metadata: {
        // TODO
        name: 'Optional >> scenario name.',
        // TODO
        labels: ['Optional >> list of arbitrary labels describing the AppMap.'],
        app: env.getAppName(),
        // TODO
        feature:
          'Optional >> name of the feature to associate with the scenario. If the named feature does not exist, it may be created.',
        // TODO
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
          // TODO
          defined_class:
            'Required >> name of the class which defines the entry-point function.',
          // TODO
          method_id: 'Required >> name of the recorded function.',
        },
        git: git.isRepository()
          ? {
              repository: git.getRepositoryURL(),
              branch: git.getBranchName(),
              commit: git.getCommitHash(),
              status: git.getStatus(),
              tag: git.getLatestTag(),
              annotated_tag: git.getLatestAnnotatedTag(),
              commits_since_tag: git.getNumberCommitsSinceLatestTag(),
              commits_since_annotated_tag: git.getNumberCommitsSinceLatestAnnotatedTag(),
            }
          : null,
      },
    };
  }
  
  registerObject (object) 
  
  addPackage (name, type, childeren) {}
  
  addClass () {}
  
  addFunction () {}
  
  
  
  
}
