export const load = (url, context, loadDefaultAsync) => {
  console.log(`loading ${url}`);
  return loadDefaultAsync(url, context, loadDefaultAsync);
};
