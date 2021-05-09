
const yo1 = () => {
  let total = 0;
  for (let index = 0; index < 100000; index++) {
    total = ((x, y) => x + y)(total, index);
  }
  return total;
}

const yo2 = () => {
  const f = (x, y) => x + y;
  let total = 0;
  for (let index = 0; index < 100000; index++) {
    total = f(total, index);
  }
  return total;
};

const measure = (callback) => {
  const start = process.hrtime.bigint();
  const result = callback();
  const end = process.hrtime.bigint();
  console.log(result, end - start);
  return end - start;
};

const time1 = measure(yo1);
const time2 = measure(yo2);
console.log(time1 / time2);
