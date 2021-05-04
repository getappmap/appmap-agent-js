import { strict as Assert } from 'assert';
import { makeAppmapSync, makeAppmap } from '../../../../../../lib/client/es2015/node14x/index.js';

(
  (async () => {
    {
      const appmap = makeAppmapSync({
        protocol: {
          requestSync: (json) => {
            Assert.equal(json.action, "initialize");
            return {enabled: false, session: null, namespace: null};
          },
          request: () => {
            Assert.fail();
          }
        }
      })
      appmap.terminateSync("reason");
    }
    {
      const appmap = await makeAppmap({
        protocol: {
          requestSync: () => {
            Assert.fail();
          },
          request: (json, pending) => {
            if (json.action === "initialize") {
              return pending.resolve({enabled: true, session: "session", namespace: "__HIDDEN__"});
            }
            if (json.action === "terminate") {
              return pending.resolve(null);
            }
            Assert.fail();
          }
        }
      });
      Assert.equal(typeof __HIDDEN__, 'object');
      await appmap.terminate("reason");
    }
  })
  ()
);
