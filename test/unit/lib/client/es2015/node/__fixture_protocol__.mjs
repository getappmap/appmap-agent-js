import { strict as Assert } from 'assert';

export default {
  requestSync: (json) => {
    if (json.name === 'initialize') {
      return {
        session: 'session',
        prefix: 'prefix',
      };
    }
    if (json.name === 'terminate') {
      return null;
    }
    Assert.fail();
    return null;
  },
  requestAsync: (json) => {
    Assert.fail();
  },
};
