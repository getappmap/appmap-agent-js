import * as FileSystem from 'fs';
import * as ChildProcess from 'child_process';
import { strict as Assert } from 'assert';
import git from '../../../../lib/server/git.mjs';

const AssertStrict = Assert.strict;

const url = 'https://github.com/lachrist/sample.git';
const path = 'tmp/test/sample-git/';

if (!FileSystem.existsSync(path)) {
  ChildProcess.execSync(`git clone ${url} ${path}`);
}

{
  const infos = git(path);
  AssertStrict.ok(infos.repository, url);
  AssertStrict.equal(infos.branch, 'main');
  AssertStrict.equal(typeof infos.commit, 'string');
  AssertStrict.ok(Array.isArray(infos.status));
  AssertStrict.equal(typeof infos.annotated_tag, 'string');
  AssertStrict.equal(typeof infos.tag, 'string');
  AssertStrict.equal(typeof infos.commits_since_annotated_tag, 'number');
  AssertStrict.equal(typeof infos.commits_since_tag, 'number');
}

Assert.equal(git('/'), null);
