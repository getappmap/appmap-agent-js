import Require from "./require.mjs";

const { apply } = Reflect;

const DATABASE = "mysql";
const VERSION = null;

export default (dependencies) => {
  const {
    util: { spyOnce, assignProperty },
    agent: {
      getFreshTab,
      recordBeginEvent,
      recordEndEvent,
      recordBeforeEvent,
      recordAfterEvent,
      formatQueryPayload,
      getAnswerPayload,
      getBundlePayload,
    },
  } = dependencies;
  const { requireMaybe } = Require(dependencies);
  return {
    unhook: (backup) => {
      backup.forEach(assignProperty);
    },
    hook: (agent, { repository: { directory }, hooks: { mysql } }) => {
      const Mysql = requireMaybe(mysql, directory, "mysql");
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
        ({ sql, values, _callback: callback } = { values: [], ...query });
        const bundle_tab = getFreshTab(agent);
        recordBeginEvent(agent, bundle_tab, bundle_payload);
        const jump_tab = getFreshTab(agent);
        recordBeforeEvent(
          agent,
          jump_tab,
          formatQueryPayload(agent, DATABASE, VERSION, sql, values),
        );
        query._callback = spyOnce((error, result, field) => {
          recordAfterEvent(agent, jump_tab, answer_payload);
          recordEndEvent(agent, bundle_tab, bundle_payload);
        }, callback);
        return apply(original, this, [query]);
      };
      return [{ object: prototype, key: "query", value: original }];
    },
  };
};
