const {
  URL,
  navigator: { userAgent: description },
} = globalThis;

const { search: __search } = new URL(import.meta.url);

const { ExternalAppmapError } = await import(
  `../../error/index.mjs${__search}`
);
const { logErrorWhen } = await import(`../../log/index.mjs${__search}`);
const { assert } = await import(`../../util/index.mjs${__search}`);

const regexp = /^([^ \n\t/]+)\/([^ \n\t/]+) /u;

export const getEngine = () => {
  const parts = regexp.exec(description);
  assert(
    !logErrorWhen(
      parts === null,
      "Could not parse navigator.userAgent: %j",
      description,
    ),
    "Could not parse userAgent",
    ExternalAppmapError,
  );
  return `${parts[1]}@${parts[2]}`;
};
