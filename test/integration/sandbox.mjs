// import * as Path from 'path';
import * as FileSystem from 'fs';
import { strict as Assert } from 'assert';
import { main } from '../../lib/server/main.mjs';

FileSystem.writeFileSync(
  'tmp/test/appmap.json',
  JSON.stringify(
    {
      output: {
        directory: '.',
        'file-name': 'foo',
      },
      enabled: true,
      packages: [
        {
          path: 'main.js',
        }
      ],
      children: [
        {
          type: 'fork',
          recorder: 'normal',
          main: 'main.js',
        },
      ],
    },
    null,
    2,
  ),
  'utf8',
);

FileSystem.writeFileSync(
  'tmp/test/main.js',
  `
    function main () {}
    main();
  `,
  'utf8',
);

try {
  FileSystem.unlinkSync('tmp/test/foo.appmap.json');
} catch (error) {
  Assert.equal(error.code, 'ENOENT');
}
main(process, {
  extends: 'tmp/test/appmap.json',
  _: [],
}).then((either) => {
  Assert.equal(
    either.fromRight(),
    0,
  );
});
