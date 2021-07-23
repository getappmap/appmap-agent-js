export default (dependencies) => {
  return {
    createCounter: () => ({ value: 0 }),
    getCounterValue: ({ value }) => value,
    incrementCounter: (counter) => (counter.value += 1),
    decrementCounter: (counter) => (counter.value -= 1),
  };
};
