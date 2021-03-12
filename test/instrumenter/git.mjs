import * as Assert from 'assert';
import Git from '../../lib/instrumenter/git.mjs';
import * as Logger from '../../lib/instrumenter/logger.mjs';

const AssertStrict = Assert.strict;
Logger.reloadGlobalLevel('CRITICAL');

const git = new Git();

AssertStrict.equal(git.isRepository(), true);
AssertStrict.equal(
  git.getRepositoryURL(),
  'https://github.com/applandinc/appmap-agent-js',
);
AssertStrict.equal(typeof git.getBranchName(), 'string');
AssertStrict.match(git.getCommitHash(), /^[a-fA-F0-9]+$/);
AssertStrict.ok(Array.isArray(git.getStatus()));
git.getLatestTag();
git.getLatestAnnotatedTag();
git.getCommitNumberSinceLatestTag();
git.getCommitNumberSinceLatestAnnotatedTag();
