
export default class Location {
  consructor (file, node, context, parents) {
    this.file = file;
    this.node = node;
    this.context = context;
    this.parents = parents;
  }
  getLanguageVersion () {
    return this.file.version;
  }
  getSourceType () {
    return this.file.source;
  }
  shouldBeInstrumented () {
    return (this.parents.length + 1) > this.depth;
  }
  makeDeeperLocation (node, context) {
    return new Location(this.file, node, context, [...parents, {node:this.node, context:this.context}]);
  }
  makeEntity (childeren) {
    if (this.node.type === "ArrowFunctionExpression" || this.node.type === "FunctionExpression" || this.node.type === "FunctionDeclaration") {
      return {
        type: "class",
        name: this.context.getName(),
        childeren: [{
          type: "function",
          name: "()",
          source: this.file.content.substring(this.node.start, this.node.end),
          location: `${this.file.path}:${this.node.loc.start.line}`,
          labels: [],
          comment: null,
          static: this.context.isStatic()
        }].concat(childeren)
      };
    }
    if (this.node.type === "ObjectExpression" || this.node.type === "ClassExpression" || this.node.type === "ClassDeclaration") {
      return {
        type: "class",
        name: this.context.getName(),
        childeren
      };
    }
    if (this.type === "Program") {
      return {
        type: "package",
        name: this.file.path
        childeren
      };
    }
    logger.error(`Invalid node type for creating appmap, got: ${node.type}`);
    return {
      type: node.type,
      name: this.context.getName(),
      childeren
    };
  }
}
