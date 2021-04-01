import { strict as Assert } from 'assert';
import File from '../../../../lib/file.mjs';
import Namespace from '../../../../lib/namespace.mjs';
import instrument from '../../../../lib/instrument/index.mjs';

const file = new File('filename.js', 2020, 'script', `123;`);
const namespace = new Namespace('PREFIX');
const content = instrument(file, namespace);
Assert.deepEqual(content, {
  content: `123;`,
  entities: [
    {
      type: 'package',
      name: 'filename.js',
      childeren: [],
    },
  ],
});
