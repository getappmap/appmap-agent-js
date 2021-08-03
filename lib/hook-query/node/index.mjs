import MySQL from "./mysql.mjs";

export default (dependencies) => {
  const { hookMysql, unhookMysql } = MySQL(dependencies);
  return {
    hookQuery: (client, frontend, configuration) => ({
      mysql: hookMysql(client, frontend, configuration),
    }),
    unhookQuery: ({ mysql }) => {
      unhookMysql(mysql);
    },
  };
};
