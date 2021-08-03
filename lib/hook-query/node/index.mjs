import MySQL from "./mysql.mjs";

export default (dependencies) => {
  const { hookMysqlAsync } = MySQL(dependencies);
  return {
    hookQueryAsync: (...args) => Promise.all([hookMysqlAsync(...args)]),
  };
};
