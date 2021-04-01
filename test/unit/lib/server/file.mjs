import * as FileSystem from 'fs';
import { strict as Assert } from 'assert';
import File from '../../../lib/file.mjs';

FileSystem.writeFileSync('tmp/test/script-es5.js', `var x = 123;`, 'utf8');
FileSystem.writeFileSync('tmp/test/script-es2015.js', `let x = 123;`, 'utf8');
FileSystem.writeFileSync(
  'tmp/test/module-es2015.js',
  `export let x = 123;`,
  'utf8',
);

{
  const file = new File('tmp/test/script-es5.js', 5, 'script');
  Assert.equal(file.getPath(), 'tmp/test/script-es5.js');
  Assert.equal(file.getLanguageVersion(), 5);
  Assert.equal(file.getSourceType(), 'script');
  Assert.equal(file.getContent(), `var x = 123;`);
  Assert.doesNotThrow(() => {
    file.parse();
  });
}

{
  const file = new File('tmp/test/script-es2015.js', 2015, 'script');
  Assert.doesNotThrow(() => {
    file.parse();
  });
}

{
  const file = new File('tmp/test/module-es2015.js', 2015, 'module');
  Assert.doesNotThrow(() => {
    file.parse();
  });
}

{
  const file = new File('tmp/test/script-es2015.js', 5, 'script');
  Assert.throws(() => {
    file.parse();
  }, SyntaxError);
}

{
  const file = new File('tmp/test/module-es2015.js', 2015, 'script');
  Assert.throws(() => {
    file.parse();
  }, SyntaxError);
}
