
import * as Assert from "assert";
import * as Git from "../../lib/instrumenter/git.mjs";

const AssertStrict = Assert.strict;

AssertStrict.equal(Git.getRepositoryURL(), "https://github.com/applandinc/appmap-agent-js");
AssertStrict.equal(typeof Git.getBranchName(), "string");
AssertStrict.match(Git.getCommitHash(), /^[a-fA-F0-9]+$/);
AssertStrict.ok(Array.isArray(Git.getStatus()));
Git.getLatestTag();
Git.getLatestAnnotatedTag();
Git.getCommitNumberSinceLatestTag();
Git.getCommitNumberSinceLatestAnnotatedTag();
