import * as FileSystem from 'fs';
import * as ChildProcess from 'child_process';
import { strict as Assert } from 'assert';
import { getGitInformation } from '../../../../../lib/server/configuration/git.mjs';

const AssertStrict = Assert.strict;

const url = 'https://github.com/lachrist/sample.git';
const path = 'tmp/test/sample-git/';

if (!FileSystem.existsSync(path)) {
  ChildProcess.execSync(`git clone ${url} ${path}`);
}

{
  const infos = getGitInformation(path);
  AssertStrict.ok(infos.repository, url);
  AssertStrict.equal(infos.branch, 'main');
  AssertStrict.equal(typeof infos.commit, 'string');
  AssertStrict.ok(Array.isArray(infos.status));
  AssertStrict.equal(typeof infos.annotated_tag, 'string');
  AssertStrict.equal(typeof infos.tag, 'string');
  AssertStrict.equal(typeof infos.commits_since_annotated_tag, 'number');
  AssertStrict.equal(typeof infos.commits_since_tag, 'number');
}

Assert.ok(getGitInformation('.') !== null);

FileSystem.rmSync('tmp/test/git', { force: true, recursive: true });
Assert.equal(getGitInformation('tmp/test/git'), null);

FileSystem.mkdirSync('tmp/test/git');
Assert.equal(getGitInformation('tmp/test/git'), null);

//
// try {
//   FileSystem.unlinkSync("tmp/test/foo.txt");
// } catch (error) {
//   Assert.equal(error.code, "ENOENT");
// }
// Assert.equal(getGitInformation('tmp/test/foo.txt'), null);
//
// FileSystem.writeFileSync("tmp/test/foo.txt", "bar", "utf8");
// Assert.equal(getGitInformation('tmp/test/foo.txt'), null);
