import { toString, spyOnce, assignProperty } from "../../util/index.mjs";
import { requirePeerDependency } from "../../peer/index.mjs";
import {
  getFreshTab,
  recordBeginEvent,
  recordEndEvent,
  recordBeforeEvent,
  recordAfterEvent,
  formatQueryPayload,
  getAnswerPayload,
  getBundlePayload,
} from "../../agent/index.mjs";

const {
  Object,
  Reflect: { apply },
} = globalThis;

const DATABASE = "mysql";
const VERSION = null;

export const unhook = (backup) => {
  backup.forEach(assignProperty);
};

export const hook = (
  agent,
  { repository: { directory }, hooks: { mysql } },
) => {
  const Mysql = mysql
    ? requirePeerDependency("sqlite3", {
        directory,
        strict: true,
      })
    : null;
  if (Mysql === null) {
    return [];
  }
  const bundle_payload = getBundlePayload(agent);
  const answer_payload = getAnswerPayload(agent);
  const { createConnection, createQuery } = Mysql;
  const { __proto__: prototype } = createConnection({});
  const { query: original } = prototype;
  prototype.query = function query(sql, values, callback) {
    const query = createQuery(sql, values, callback);
    const bundle_tab = getFreshTab(agent);
    recordBeginEvent(agent, bundle_tab, bundle_payload);
    const jump_tab = getFreshTab(agent);
    recordBeforeEvent(
      agent,
      jump_tab,
      formatQueryPayload(
        agent,
        DATABASE,
        VERSION,
        toString(query.sql),
        Object(query.values),
      ),
    );
    const { _callback: query_callback } = query;
    query._callback = spyOnce((_error, _result, _field) => {
      recordAfterEvent(agent, jump_tab, answer_payload);
      recordEndEvent(agent, bundle_tab, bundle_payload);
    }, query_callback);
    return apply(original, this, [query]);
  };
  return [{ object: prototype, key: "query", value: original }];
};
