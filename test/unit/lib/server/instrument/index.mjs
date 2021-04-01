import { strict as Assert } from 'assert';
import File from '../../../../../lib/server/file.mjs';
import Namespace from '../../../../../lib/server/namespace.mjs';
import instrument from '../../../../../lib/server/instrument/index.mjs';

const file = new File(2020, 'script', 'filename.js', `123;`);
const namespace = new Namespace('PREFIX');
const entities = [];
const content = instrument(file, namespace, (entity) => {
  entities.push(entity);
});
Assert.equal(content, `123;`);
Assert.deepEqual(entities, [
  {
    type: 'package',
    name: 'filename.js',
    childeren: [],
  }
]);
