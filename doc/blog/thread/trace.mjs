// trace.mjs
let ctr = 0;
export const trace = (fct, ...args) => {
  ctr += 1;
  const idx = ctr;
  console.log(
    `${process.pid} call   #${idx} ${fct.name} ${JSON.stringify(args)}`,
  );
  const res = fct(...args);
  console.log(
    `${process.pid} return #${idx} ${fct.name} ${JSON.stringify(res)}`,
  );
  return res;
};
export const traceAsync = async (fct, ...args) => {
  ctr += 1;
  const idx = ctr;
  console.log(
    `${process.pid} call   #${idx} ${fct.name} ${JSON.stringify(args)}`,
  );
  const res = await fct(...args);
  console.log(
    `${process.pid} return #${idx} ${fct.name} ${JSON.stringify(res)}`,
  );
  return res;
};
