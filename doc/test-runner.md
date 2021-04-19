One important feature of the appmap framework is to automatically produce a dedicated appmap for each test file of the test suite of an application. In order to do that we need to understand the concurrency model of the test runner. I've detected two main approaches.

The first approach consists in executing each test file in isolation within a dedicated node process (node-tap, tape, ava). This strategy works well with the current agent which by default produce one appmap per node process.

The second approach consists in executing all the test files within the same node process (mocha, jasmine, jest). There is three challenges associated with this approach:
- *Initializing a dedicated appmap for each test file loaded*. We need to insert hooks into the test runner to detect when it loads a test file. This is dependent on the test runners -- eg some use `require`, others use `readFileSync`.
- *Assigning events to the correct appmap*. Once an event is recorded by the instrumented code, it should be directed toward the correct appmap. There is three options:
  - *Test cases are synchronous*. We can insert hooks to the test runner right before a test file is executed to update a global variable with the current appmap name. Again this is dependent on the test runner.
  - *Test cases are asynchronous but files are executed sequentially*. Even if the test cases of a file may be interleaved they will not interleave with test cases from other test files. Hence the same strategy as for synchronous test cases can be used.
  - *Test cases are asynchronous and files are executed concurrently*. This is the worst options because test cases from different files can be interleaved. I'm not sure of the practical relevancy of such options and supporting it is low priority. We could solve this by using the experimental native module: https://nodejs.org/api/async_hooks.html. This module enables to generate a dependency graph of node events and trace back an event to its root cause inside a test case. Note that, in general, it would worthwhile to provide such event dependency information to the user because node applications tend to have a relatively flat call stack due to asynchronous behaviours.
- *Assigning classMap elements to the correct appmap*. Because every test file share the same module cache, a test file might use a module without notifying the agent. I see three potential fixes:
  - *Augmenting instrumentation hooks*. We augment the commonjs hooks with logics to detect loads from the cache. This is not however possible for native modules.
  - *Disabling the cache*. We could disable the cache but this could create observable changes to the test runner and the program under tests.
  - *Whitelisting modules*. The best solution imo is to simply not include classMap elements which did not have been exercised by the test file.

<!-- 
https://docs.google.com/document/d/1220yrW37L-PvIA6lfmq5uS4br9Ouu0fRisVXXWrtkXY/edit


```js
let loadtime = true;
const assert = require('assert');
describe('FileSystem', function() {
  assert.equal(loadtime, true);
  describe('#indexOf()', function() {
    assert.equal(loadtime, true);
    it('should return -1 when the value is not present', function() {
      assert.equal(loadtime, false);
      assert.equal([1, 2, 3].indexOf(4), -1);
    });
  });
});
loadtime = false;
``` -->
