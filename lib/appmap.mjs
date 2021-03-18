
import * as Path from 'path';
import * as Fs from 'fs';
import * as Url from 'url';

import Logger from "./logger.mjs";

const APPMAP_VERSION = '1.4';

const client = Fs.readFileSync(Path.join(Path.dirname(new Url.URL(import.meta.url).pathname), '..', '..', 'package.json'), 'utf8');

export const makePackageEntity = (path, childeren) => ({
  type: "package",
  path,
  childeren
});

export const makeClassEntity = (location, childeren) => ({
  type: "class",
  name: location.getName(),
  childeren
});

export const makeFunctionEntity = (location, childeren) => ({
  type: "class",
  name: location.getName(),
  childeren: [{
    type: "function",
    name: "()",
    location: `${location.getPath()}:${location.getStartLine()}`,
    static: location.isStatic(),
    labels: location.getLabels(),
    comment: location.getComment(),
    source: location.getSource(),
  }].concat(childeren)
});



export class Entity {
  constructor (type, name) {
    this.type = type;
    this.name = name;
  }
}

exports class ClassEntity extends Entity {
  constructor (location, childeren) {
    if (node.type !== "ObjectExpression" && node.type !== "ClassExpression" && node.type !== "ClassDeclaration") {
      throw new Error(`Invalid estree node for appmap class object`);
    }
    super('class', location.getName());
    this.childeren = childeren;
  }
}

exports class FunctionEntity extends Entity {
  constructor (location, childeren) {
    super('class', location.getName());
    this.childeren = [new AppmapFunctionEntity(location)].concat(childeren);
  }
}

class AppmapFunctionEntity extends Entity {
  constructor (location) {
    super('function', '()');
    this.location = `${location.getPath()}:${location.getStartLine()}`,
    this.static = `${location.isStatic()}`,
    this.labels = `${location.getLabels()}`,
    this.comment = `${location.getComment()}`,
    this.source = `${location.getSource()}`
    this.location = `${file.path}:${node.loc.start.line}`;
  }
}

export class AppMap {
  constructor(git, settings) {
    this.archived = false;
    this.settings = settings;
    this.appmap = {
      version: APPMAP_VERSION,
      metadata: {
        // TODO
        name: 'Optional >> scenario name.',
        // TODO
        labels: ['Optional >> list of arbitrary labels describing the AppMap.'],
        app: settings.getAppName(),
        // TODO
        feature:
          'Optional >> name of the feature to associate with the scenario. If the named feature does not exist, it may be created.',
        // TODO
        feature_group:
          'Optional >> name of the feature group to associate with the scenario. If the named feature group does not exist, it may be created.',
        language: {
          name: 'javascript',
          engine: null,
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
      classMap: [],
      events: [],
    };
  }
  setEngine (name, version) {
    if (this.archived) {
      return logger.error(`Trying to set the engine on an archived appmap`);
    }
    if (this.appmap.metadata.language.engine !== null) {
      logger.error(`Overwritting of appmap.metadata.language.engine`);
    }
    this.appmap.metadata.language.engine = `${name}@${version}`;
  }
  addPackage (path, childeren) {
    if (this.archived) {
      return logger.error(`Trying to add a package on an archived appmap`);
    }
    this.appmap.classMap.push({
      type: "package",
      path,
      childeren
    });
  }
  addEvent (event) {
    if (this.archived) {
      return logger.error(`Trying to add an event on an archived appmap`);
    }
    this.appmap.events.push(event);  
  }
  archive () {
    if (this.archived) {
      return logger.error(`Trying to archive an already archived appmap`);
    }
    this.archived = true;
    Fs.writeFileSync(Path.join(this.settings.getOutputDir(), this.appmap.metadata.name), JSON.stringify(this.appmap, null, 2), "utf8");
  }
}
