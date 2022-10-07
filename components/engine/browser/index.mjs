const {
  URL,
  navigator: { userAgent: description },
} = globalThis;

const { search: __search } = new URL(import.meta.url);

const { expect } = await import(`../../expect/index.mjs${__search}`);

const regexp = /^([^ \n\t/]+)\/([^ \n\t/]+) /u;

export const getEngine = () => {
  const parts = regexp.exec(description);
  expect(
    parts !== null,
    "could not parse navigator.userAgent: %j",
    description,
  );
  return `${parts[1]}@${parts[2]}`;
};
