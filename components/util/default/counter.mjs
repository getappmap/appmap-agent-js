export const createCounter = (value) => ({ value });
export const getCounterValue = ({ value }) => value;
export const incrementCounter = (counter) => (counter.value += 1);
export const decrementCounter = (counter) => (counter.value -= 1);
