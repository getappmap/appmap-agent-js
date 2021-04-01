import * as FileSystem from 'fs';
import * as ChildProcess from 'child_process';
import { strict as Assert } from 'assert';
import * as Logger from '../../../../lib/server/logger.mjs';
import Git from '../../../../lib/server/git.mjs';

const AssertStrict = Assert.strict;
Logger.reloadGlobalLevel('DEBUG');

const url = 'https://github.com/lachrist/sample.git';
const path = 'tmp/test/sample-git/';

if (!FileSystem.existsSync(path)) {
  ChildProcess.execSync(`git clone ${url} ${path}`);
}

{
  const git = new Git(path);
  AssertStrict.equal(git.isRepository(), true);
  AssertStrict.equal(git.getRepositoryURL(), url);
  AssertStrict.equal(git.getBranchName(), 'main');
  AssertStrict.equal(
    git.getCommitHash(),
    'd15a7e72b7d0710a5f589ae1e5152492d8bb1eff',
  );
  AssertStrict.ok(Array.isArray(git.getStatus()));
  AssertStrict.equal(git.getLatestTag(), 'v0.0.1');
  AssertStrict.equal(git.getLatestAnnotatedTag(), 'v0.0.0');
  AssertStrict.equal(git.getCommitNumberSinceLatestTag(), 1);
  AssertStrict.equal(git.getCommitNumberSinceLatestAnnotatedTag(), 2);
}

{
  const git = new Git('/');
  AssertStrict.equal(git.isRepository(), false);
  AssertStrict.equal(git.getRepositoryURL(), null);
  AssertStrict.equal(git.getBranchName(), null);
  AssertStrict.equal(git.getCommitHash(), null);
  AssertStrict.deepEqual(git.getStatus(), null);
  AssertStrict.equal(git.getLatestTag(), null);
  AssertStrict.equal(git.getLatestAnnotatedTag(), null);
  AssertStrict.equal(git.getCommitNumberSinceLatestTag(), null);
  AssertStrict.equal(git.getCommitNumberSinceLatestAnnotatedTag(), null);
}
