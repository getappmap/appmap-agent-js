
export class Location {
  consructor (file, parents, node, context) {
    this.file = file;
    this.parents = parents;
    this.node = node;
    this.context = context;
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
    return new Location(this.file, [...parents, {node:this.node, context:this.context}], node, context);
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
      type: "unknown",
      name: this.context.getName(this.file.path),
      childeren
    };
  }
}
