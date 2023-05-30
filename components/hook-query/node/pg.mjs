/* c8 ignore start */

import { toString, spyOnce, assignProperty } from "../../util/index.mjs";
import { requirePeerDependency } from "../../peer/index.mjs";
import { getCurrentGroup } from "../../group/index.mjs";
import { now } from "../../time/index.mjs";
import {
  getFreshTab,
  recordBeginBundleEvent,
  recordEndBundleEvent,
  recordBeforeQueryEvent,
  recordAfterAnswerEvent,
} from "../../frontend/index.mjs";
import { toParameterCollection } from "./convert.mjs";

const {
  undefined,
  Reflect: { apply },
  Promise,
  TypeError,
} = globalThis;

const VERSION = null;
const DATABASE = "postgres";

export const unhook = (backup) => {
  backup.forEach(assignProperty);
};

export const hook = (
  frontend,
  { repository: { directory }, hooks: { pg } },
) => {
  if (pg === false) {
    return [];
  } else {
    const Postgres = requirePeerDependency("pg", {
      directory,
      strict: pg === true,
    });
    if (Postgres === null) {
      return [];
    } else {
      const { Client, Query } = Postgres;
      const { prototype } = Client;
      const { query: original } = prototype;
      const { query } = {
        // We use the method syntax to create a function that is not constructor.
        query(query, values, callback) {
          if (query === null || query === undefined) {
            throw new TypeError("Client was passed a null or undefined query");
          }
          let result = undefined;
          if (typeof query.submit === "function") {
            result = query;
            if (!query.callback) {
              if (typeof values === "function") {
                query.callback = values;
              } else {
                query.callback = (error, _result) => {
                  if (error !== null) {
                    query.emit("error", error);
                  }
                };
              }
            }
          } else {
            query = new Query(query, values, callback);
            if (!query.callback) {
              result = new Promise((resolve, reject) => {
                query.callback = (error, result) => {
                  error ? reject(error) : resolve(result);
                };
              });
            }
          }
          const bundle_tab = getFreshTab(frontend);
          const jump_tab = getFreshTab(frontend);
          recordBeginBundleEvent(
            frontend,
            bundle_tab,
            getCurrentGroup(),
            now(),
          );
          recordBeforeQueryEvent(
            frontend,
            jump_tab,
            getCurrentGroup(),
            now(),
            DATABASE,
            VERSION,
            toString(query.text),
            toParameterCollection(query.values),
          );
          const { callback: query_callback } = query;
          query.callback = spyOnce((_error, _result) => {
            recordAfterAnswerEvent(
              frontend,
              jump_tab,
              getCurrentGroup(),
              now(),
            );
            recordEndBundleEvent(
              frontend,
              bundle_tab,
              getCurrentGroup(),
              now(),
            );
          }, query_callback);
          apply(original, this, [query]);
          return result;
        },
      };
      prototype.query = query;
      return [{ object: prototype, key: "query", value: original }];
    }
  }
};
