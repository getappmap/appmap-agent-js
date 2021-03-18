
export class Location {
  constructor (node, file, naming) {
    this.node = node;
    this.file = file;
    this.naming = naming;
  }
  makeEntity (childeren) {
    if (node.type === "ArrowFunctionExpression" || node.type === "FunctionExpression" || node.type === "FunctionDeclaration") {
      return {
        type: "class",
        name: this.naming.getName(),
        childeren: [{
          type: "function",
          name: "()",
          source: this.file.content.substring(this.node.start, this.node.end),
          location: `${this.file.path}:${this.node.loc.start.line}`,
          labels: [],
          comment: null,
        }].concat(childeren)
      };
    }
    if (node.type === "ObjectExpression" || node.type === "ClassExpression" || node.type === "ClassDeclaration") {
      return {
        type: "class",
        name: this.naming.getName(),
        childeren
      };
    }
    throw new Error(`Cannot make appmap entity from node`);
  }
};
