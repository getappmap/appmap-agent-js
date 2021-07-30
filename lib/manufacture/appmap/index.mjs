import * as FileSystem from 'fs';
import * as Path from 'path';
import { assert } from '../assert.mjs';
import { Left, Right } from '../either.mjs';

const VERSION = '1.6.0';

const isNotNull = (any) => any !== null;

export default (dependencies) => {

  const isFileType = ({type}) => type === "file";

  const isGroupType = ({type}) => type === "group";

  const getData = ({data}) => data;

  const isRemainder = ({type}) => type !== "file" && type !== "group";

  return {
    manufacture: (trace, configuration1) => {
      const groups = new _Map();
      const classmap = createClassmap(configuration1);
      for (let {type, data} of trace) {
        if (type === "file") {
          addClassmapFile(classmap, data);
        } else if (type === "group") {
          const {index, parent} = data;
          groups.set(index, parent);
        }
      }
      trace.filter(isFileType).forEach(getData));
      return splitTrack(trace).map(({options, events}) => {
        const configuration2 = extendConfiguration(configuration1, options, "/");
        const routes = new _Set();
        for (let {type, data} of events) {
          if (type === "apply") {
            const {function:route} = data;
            routes.add(route);
          }
        }
        const {output:{filename}, main:{path}, map:{name:name1}, app:{name:name2}, repository:{package:{name:name3}}} = configuration2;
        return {
          name: filename || path || name1 || name2 || name3 || null,
          data: {
            metadata: makeMetadata(configuration2),
            classMap: getClassmapData(classmap, routes),
            events: order(events, groups).map((event) => makeEvent(event, classmap)),
          },
        };
      });



      // const ordered_remainder = order(remainder);






      }

      return {
        version: VERSION,
        metadata,
        classMap:
        events
      }
    }
  }

}






const resetThreadId = (event) => ({
  ...event,
  thread_id: 0,
});

const navigate = (children, name) => {
  for (const child of children) {
    if (child.type === 'package' && child.name === name) {
      return child.children;
    }
  }
  const child = {
    type: 'package',
    name,
    children: [],
  };
  children.push(child);
  return child.children;
};

const split = (path) => {
  if (path === '') {
    return [];
  }
  return path.split(Path.sep);
};

const save = (recording, versioning) => {
  assert(recording.running !== null, 'terminated recording %o', recording);
  recording.running = null;
  const roots = [];
  for (const { path, entities } of recording.origins) {
    split(
      Path.relative(
        recording.configuration.getBaseDirectory(),
        Path.dirname(path),
      ),
    )
      .reduce(navigate, roots)
      .push({
        type: 'package',
        name: Path.basename(path),
        children: entities,
      });
  }
  return {
    content: JSON.stringify({
      version: VERSION,
      metadata: recording.configuration.getMetaData(),
      classMap: roots,
      events: manufactureStack(recording.events),
    }),
    path: `${versioning(recording.configuration.getOutputPath())}.appmap.json`,
  };
};
