import Require from "./require.mjs";

const {
  undefined,
  Reflect: { apply },
  Promise,
  TypeError,
} = globalThis;

const VERSION = null;
const DATABASE = "postgres";

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
    hook: (agent, { repository: { directory }, hooks: { pg } }) => {
      const Postgres = requireMaybe(pg, directory, "pg");
      if (Postgres === null) {
        return [];
      }
      const bundle_payload = getBundlePayload(agent);
      const answer_payload = getAnswerPayload(agent);
      const { Client, Query } = Postgres;
      const { prototype } = Client;
      const { query: original } = prototype;
      const { query } = {
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
          const bundle_tab = getFreshTab(agent);
          const jump_tab = getFreshTab(agent);
          recordBeginEvent(agent, bundle_tab, bundle_payload);
          recordBeforeEvent(
            agent,
            jump_tab,
            formatQueryPayload(
              agent,
              DATABASE,
              VERSION,
              query.text,
              query.values || {},
            ),
          );
          callback = query.callback;
          query.callback = spyOnce((_error, _result) => {
            recordAfterEvent(agent, jump_tab, answer_payload);
            recordEndEvent(agent, bundle_tab, bundle_payload);
          }, callback);
          apply(original, this, [query]);
          return result;
        },
      };
      prototype.query = query;
      return [{ object: prototype, key: "query", value: original }];
    },
  };
};
