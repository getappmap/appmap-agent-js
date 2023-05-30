/* c8 ignore start */

import { toString, spyOnce, assignProperty } from "../../util/index.mjs";
import { requirePeerDependency } from "../../peer/index.mjs";
import { getCurrentGroup } from "../../group/index.mjs";
import { now } from "../../time/index.mjs";
import {
  getFreshTab,
  recordBeforeQueryEvent,
  recordAfterAnswerEvent,
  recordBeginBundleEvent,
  recordEndBundleEvent,
} from "../../frontend/index.mjs";
import { toParameterCollection } from "./convert.mjs";

const {
  Reflect: { apply },
} = globalThis;

const DATABASE = "mysql";
const VERSION = null;

export const unhook = (backup) => {
  backup.forEach(assignProperty);
};

export const hook = (
  frontend,
  { repository: { directory }, hooks: { mysql } },
) => {
  if (mysql === false) {
    return [];
  } else {
    const Mysql = requirePeerDependency("mysql", {
      directory,
      strict: mysql === true,
    });
    if (Mysql === null) {
      return [];
    } else {
      const { createConnection, createQuery } = Mysql;
      const { __proto__: prototype } = createConnection({});
      const { query: original } = prototype;
      prototype.query = function query(sql, values, callback) {
        const query = createQuery(sql, values, callback);
        const bundle_tab = getFreshTab(frontend);
        const jump_tab = getFreshTab(frontend);
        recordBeginBundleEvent(frontend, bundle_tab, getCurrentGroup(), now());
        recordBeforeQueryEvent(
          frontend,
          jump_tab,
          getCurrentGroup(),
          now(),
          DATABASE,
          VERSION,
          toString(query.sql),
          toParameterCollection(query.values),
        );
        const { _callback: query_callback } = query;
        query._callback = spyOnce((_error, _result, _field) => {
          recordAfterAnswerEvent(frontend, jump_tab, getCurrentGroup(), now());
          recordEndBundleEvent(frontend, bundle_tab, getCurrentGroup(), now());
        }, query_callback);
        return apply(original, this, [query]);
      };
      return [{ object: prototype, key: "query", value: original }];
    }
  }
};
