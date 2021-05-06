
import { strict as Assert } from 'assert';
import { changeWorkingDirectory, getWorkingDirectory, resolvePath } from '../../../../../lib/server/configuration/cwd.mjs';

Assert.equal(
  getWorkingDirectory(), process.cwd()
);

Assert.equal(
  resolvePath("foo"),
  `${process.cwd()}/foo`
);

Assert.equal(
  changeWorkingDirectory("/foo", () => {
    Assert.equal(resolvePath("base"), "/foo/base");
    return 123;
  }),
  123
);

Assert.equal(
  changeWorkingDirectory(null, () => {
    Assert.equal(resolvePath("/foo"), "/foo");
    return 123;
  }),
  123
);
