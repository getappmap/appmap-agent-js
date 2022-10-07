/* eslint-disable no-undef */

const { Object, JSON, process, RegExp, undefined } = globalThis;

import { strict as assert } from "assert";
import * as sinon from "sinon";
import "../../__fixture__.mjs";
import { main, run, externals } from "./index.mjs?env=test";

describe("the status command", () => {
  beforeEach(() => {
    // Set up happy-path externals, tests for failures will override as
    // appropriate.
    externals.getPlatform = sinon.stub().returns("darwin");
    externals.lsPackage = sinon.stub().returns("{}");
    externals.showResults = sinon.stub();
    externals.getNodeVersion = sinon.stub().returns("14.19.0");

    // Make sure we got them all, notCalled will be undefined if the function
    // hasn't been replaced.
    Object.keys(externals).forEach((k) => {
      assert(externals[k].notCalled, `${k} unstubbed`);
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("main", () => {
    it("works", () => {
      const mocha_info = "{}";
      externals.lsPackage = sinon.stub().returns(JSON.stringify(mocha_info));

      const result = main(process);
      assert(result);
      assert(externals.lsPackage.calledOnce);
    });
  });

  describe("run", () => {
    it("fails for unsupported node", () => {
      const node_version = "13.0";
      externals.getNodeVersion = sinon.stub().returns(node_version);
      const result = JSON.parse(run(process));
      assert(externals.getNodeVersion.calledOnce);
      assert.equal(result.errors[0].level, "error");
      assert.match(
        result.errors[0].message,
        new RegExp(`Unsupported node version ${node_version}`, "u"),
      );
    });

    describe("mocha support", () => {
      it("calls lsPackage, handles missing mocha", () => {
        externals.lsPackage = sinon.stub().returns("{}");
        const result = JSON.parse(run(process));
        assert(externals.lsPackage.calledOnce);
        assert.equal(result.errors.length, 0);
      });

      it("handles valid", () => {
        const mocha_info = {
          dependencies: {
            mocha: {
              version: "9.1.2",
            },
          },
        };

        externals.lsPackage = sinon.stub().returns(JSON.stringify(mocha_info));
        const result = JSON.parse(run(process));
        assert.equal(result.errors.length, 0);
        assert.notEqual(result.schema, undefined);
      });

      it("handles invalid", () => {
        const mocha_version = "7.1.2";
        const mocha_info = {
          dependencies: {
            mocha: {
              version: mocha_version,
            },
          },
        };

        externals.lsPackage = sinon.stub().returns(JSON.stringify(mocha_info));
        const result = JSON.parse(run(process));
        assert(
          result.errors.find(
            (e) =>
              e.level === "error" &&
              e.message === `Unsupported mocha version ${mocha_version}`,
          ),
        );
      });
    });
  });
});
