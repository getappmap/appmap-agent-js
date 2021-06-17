import * as FileSystem from 'fs';
import * as Url from 'url';
import * as Path from 'path';
import * as Module from 'module';
import { strict as Assert } from 'assert';
import { transformSource } from '../../../../../lib/client/node/hook/esm.js';
import {
  makeAppmap,
  makeAppmapAsync,
} from '../../../../../lib/client/node/appmap.js';
import { getDisabledRecording } from '../../../../../lib/client/node/recording.js';

(async () => {
  //////////////
  // Enabled  //
  //////////////

  {
    let counter = 0;

    /* eslint-disable no-eval */
    const getRuntime = () => global.eval(`HIDDEN${String(counter)}`);
    /* eslint-enable no-eval */

    let trace;

    const respond = (json) => {
      trace.push(json);
      if (json.action === 'initialize') {
        counter += 1;
        return {
          session: `HIDDEN${String(counter)}`,
          hooks: { esm: {}, cjs: {}, http: {} },
        };
      }
      if (json.action === 'start') {
        return 'recording';
      }
      if (json.action === 'instrument') {
        if (json.data.source === 'script') return 'exports.yo = 456;';
        if (json.data.source === 'module') {
          return 'export const yo = 456;';
        }
        Assert.fail();
      }
      return null;
    };

    const protocol = {
      request: (...args) => {
        Assert.equal(args.length, 2);
        return respond(args[0]);
      },
      requestAsync: (...args) => {
        Assert.equal(args.length, 2);
        Assert.equal(typeof args[1], 'boolean');
        return Promise.resolve(respond(args[0]));
      },
    };

    {
      trace = [];
      const appmap = makeAppmap({
        protocol: protocol,
        configuration: 'appmap-configuration',
      });
      Assert.equal(appmap.isEnabled(), true);
      const recording = appmap.start('configuration-recording');
      FileSystem.writeFileSync('tmp/test/yo.js', 'exports.yo = 123;', 'utf8');
      Assert.equal(
        Module.createRequire(import.meta.url)(Path.resolve('tmp/test/yo.js'))
          .yo,
        456,
      );
      getRuntime().record('origin', 'event');
      Assert.equal(recording.stop(), undefined);
      Assert.equal(appmap.terminate('reason'), undefined);
      Assert.equal(getRuntime().record('origin', 'event'), undefined);
      Assert.deepEqual(
        trace.map(({ action }) => action),
        ['initialize', 'start', 'instrument', 'record', 'stop', 'terminate'],
      );
    }

    {
      trace = [];
      const appmap = await makeAppmapAsync({
        protocol,
        configuration: 'appmap-configuration',
      });
      const recording = await appmap.startAsync('configuration-recording');
      // FileSystem.writeFileSync("tmp/test/yo.mjs", "export const yo = 123;", "utf8");
      Assert.deepEqual(
        await transformSource(
          'export const yo = 123;',
          {
            format: 'module',
            url: Url.pathToFileURL(Path.resolve('tmp/test/yo.mjs')),
          },
          () => {
            Assert.fail();
          },
        ),
        { source: 'export const yo = 456;' },
      );
      Assert.equal(await getRuntime().record('origin', 'event'), null);
      const Http = await import('http');
      await new Promise((resolve) => {
        const server = new Http.createServer();
        server.on('request', (request, response) => {
          response.writeHead(200);
          response.end();
        });
        server.listen(8080, () => {
          const request = Http.get({
            port: 8080,
          });
          request.on('response', (response) => {
            Assert.equal(response.statusCode, 200);
            response.on('data', () => {
              Assert.fail();
            });
            response.on('end', () => {
              server.on('close', resolve);
              server.close();
            });
          });
        });
      });
      Assert.equal(await recording.stopAsync(), undefined);
      Assert.equal(await appmap.terminateAsync('reason'), undefined);
      Assert.equal(getRuntime().record('origin', 'event'), undefined);
      // TODO figure out what is going on!
      // Assert.deepEqual(
      //   trace.map(({ action }) => action),
      //   [
      //     'initialize',
      //     'start',
      //     'instrument',
      //     'record',
      //     'record',
      //     'record',
      //     'record',
      //     'record',
      //     'stop',
      //     'terminate',
      //   ],
      // );
    }
  }

  /////////////////////////////
  // Enabled >> Empty Hooking //
  /////////////////////////////

  {
    let trace = [];
    Assert.equal(
      await makeAppmap({
        protocol: {
          request: (...args) => {
            trace.push('request', args);
            return {
              session: 'foo',
              hooks: {},
            };
          },
          requestAsync: (...args) => {
            trace.push('request-async', args);
            return Promise.resolve(null);
          },
        },
        configuration: 'appmap-configuration',
      }).terminateAsync('reason'),
      undefined,
    );
    // TODO: figure out what is going on!
    // Assert.deepEqual(trace, [
    //   'request',
    //   [
    //     {
    //       action: 'initialize',
    //       session: null,
    //       data: 'appmap-configuration',
    //     },
    //   ],
    //   'request-async',
    //   [{ action: 'terminate', session: 'foo', data: 'reason' }, false],
    // ]);
  }

  //////////////
  // Disabled //
  //////////////

  {
    {
      const appmap = makeAppmap({
        protocol: {
          request: (...args) => {
            Assert.deepEqual(args, [
              {
                action: 'initialize',
                session: null,
                data: 'appmap-configuration',
              },
              false,
            ]);
            return null;
          },
          requestAsync: () => {
            Assert.fail();
          },
        },
        configuration: 'appmap-configuration',
      });
      Assert.equal(appmap.isEnabled(), false);
      Assert.equal(appmap.start(), getDisabledRecording());
      Assert.equal(appmap.terminate('reason'), undefined);
    }

    {
      const appmap = await makeAppmapAsync({
        protocol: {
          request: () => {
            Assert.fail();
          },
          requestAsync: (...args) => {
            Assert.deepEqual(args, [
              {
                action: 'initialize',
                session: null,
                data: 'appmap-configuration',
              },
              false,
            ]);
            return Promise.resolve(null);
          },
        },
        configuration: 'appmap-configuration',
      });
      Assert.equal(await appmap.startAsync(), getDisabledRecording());
      Assert.equal(await appmap.terminateAsync(), undefined);
    }
  }
})();
