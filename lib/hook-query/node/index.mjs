import MySQL from "./mysql.mjs";

export default ({dependencies}) => {
  const {hookMySQLAsync} = MySQL(dependencies);
  return {
    hookModuleAsync: (args) => Promise.all([
      hookMySQLAsync(args),
    ]),
  };
};
