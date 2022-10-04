/* c8 ignore start */

const {
  URL,
  Object,
  undefined,
  Reflect: { apply },
  Promise,
  TypeError,
} = globalThis;

const { search: __search } = new URL(import.meta.url);

const { toString, spyOnce, assignProperty } = await import(
  `../../util/index.mjs${__search}`
);
const {
  getFreshTab,
  recordBeginEvent,
  recordEndEvent,
  recordBeforeEvent,
  recordAfterEvent,
  formatQueryPayload,
  getAnswerPayload,
  getBundlePayload,
} = await import(`../../agent/index.mjs${__search}`);
const { requireMaybe } = await import(`./require.mjs${__search}`);

const VERSION = null;
const DATABASE = "postgres";

export const unhook = (backup) => {
  backup.forEach(assignProperty);
};

export const hook = (agent, { repository: { directory }, hooks: { pg } }) => {
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
          toString(query.text),
          Object(query.values),
        ),
      );
      const { callback: query_callback } = query;
      query.callback = spyOnce((_error, _result) => {
        recordAfterEvent(agent, jump_tab, answer_payload);
        recordEndEvent(agent, bundle_tab, bundle_payload);
      }, query_callback);
      apply(original, this, [query]);
      return result;
    },
  };
  prototype.query = query;
  return [{ object: prototype, key: "query", value: original }];
};
